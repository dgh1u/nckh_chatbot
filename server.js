const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mysql = require("mysql2");
const promptTemplate = require("./prompt"); // Import prompt

const app = express();

// Enable CORS so your Vue frontend (localhost:5173) can call this API
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Kết nối MySQL sử dụng mysql2 với promise
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Duonghieutkhd123",
  database: "kltn",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Kết nối MySQL thất bại: ", err);
  } else {
    console.log("✅ Đã kết nối đến MySQL");
  }
});

// Cấu hình Gemini AI
const apiKey = "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

// Các từ khóa SQL nguy hiểm cần chặn (có thể mở rộng thêm nếu cần)
const DANGEROUS_SQL = [
  "insert", "update", "delete", "drop", "alter", "create", "truncate", "grant", "revoke", "replace",
  "shutdown", "restart", "exec", "call"
];

// Hàm kiểm tra nội dung độc hại (Biên, phân vùng tương đương, Regex mạnh mẽ hơn)
function isDangerousQuestion(question) {
  const lower = question.toLowerCase();
  // Nếu chứa bất kỳ từ khoá nguy hiểm hoặc yêu cầu thực thi lệnh
  return DANGEROUS_SQL.some((kw) => lower.includes(kw)) ||
    /xóa|xoá|thay\s*đổi|chỉnh\s*sửa|xóa\s*dữ\s*liệu|xoa\s*dữ\s*liệu|tạo\s*mới|cấp\s*quyền|xóa\s*bảng|reset|thực\s*thi\s*lệnh|bật\s*chế\s*độ|gán\s*quyền|update|delete|insert|drop|grant|revoke|replace|truncate/i.test(lower);
}

// Route hiển thị giao diện
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API để chatbot xử lý câu hỏi SQL và tạo câu trả lời dạng text
app.post("/query", async (req, res) => {
  const userQuestion = req.body.question;
  if (!userQuestion)
    return res.status(400).json({ error: "Thiếu câu hỏi đầu vào" });

  // 1. **Chặn các câu hỏi độc hại**
  if (isDangerousQuestion(userQuestion)) {
    return res.status(403).json({
      error: "Bạn không có quyền thực hiện yêu cầu này. Bạn chỉ được phép xem thông tin, không được thực hiện thao tác thay đổi hệ thống!"
    });
  }

  try {
    // 2. **Thay đổi prompt để nhấn mạnh quyền hạn người dùng**
    //    Gửi thêm hướng dẫn cho AI: "Người hỏi chỉ là user thông thường, không phải admin, không thực hiện lệnh thay đổi hệ thống"
    const safePrompt =
      `Người hỏi dưới đây là người dùng bình thường (không phải admin), chỉ được phép xem các thông tin bot cung cấp, tuyệt đối không được thực hiện hoặc hướng dẫn bất kỳ thao tác nào thay đổi dữ liệu hay cấu hình hệ thống. Nếu phát hiện yêu cầu thay đổi dữ liệu, trả lời lịch sự rằng không được phép.
      
      Câu hỏi: ${userQuestion}
      ${promptTemplate(userQuestion)}
      `;

    const chatSession = model.startChat({ generationConfig });
    const result = await chatSession.sendMessage(safePrompt);
    let sqlQuery = result.response
      .text()
      .trim()
      .replace(/```/g, "")
      .replace(/^sql\s*/i, "");

    // 3. **Chặn SQL độc hại ngay trước khi query thực tế**
    if (isDangerousQuestion(sqlQuery)) {
      return res.status(403).json({
        error: "Yêu cầu truy vấn của bạn chứa thao tác không an toàn. Vui lòng chỉ thực hiện các thao tác xem dữ liệu!"
      });
    }

    console.log("🔍 SQL đã xử lý:", sqlQuery);

    const [queryResult] = await db.promise().query(sqlQuery);
    console.log("🔍 Kết quả truy vấn:", queryResult);

    const answerPrompt = `
Bạn là chatbot chỉ phục vụ trả lời thông tin truy vấn. Người hỏi không phải là admin, chỉ được xem kết quả truy vấn, không được thay đổi bất cứ dữ liệu nào.
Dữ liệu truy vấn từ cơ sở dữ liệu:

1. ${JSON.stringify(queryResult, null, 2)} (Kết quả truy vấn thành công)
2. ${JSON.stringify(sqlQuery)} (Cách truy vấn vào db của tôi)

Câu hỏi: ${userQuestion}
Câu trả lời: Tạo ra câu trả lời có chủ ngữ, vị ngữ bằng tiếng Việt phù hợp với data nhận được từ queryResult. (lưu ý câu trả lời không đề cập đến thông tin lấy từ database mà chỉ thêm câu từ cho đủ chủ ngữ,vị ngữ) + (Format câu trả lời: Sử dụng các cách ngăn cách hợp lí cho từng dữ liệu, không dùng *).
Nếu người hỏi yêu cầu thao tác thay đổi hệ thống hoặc dữ liệu, vui lòng lịch sự từ chối và giải thích người hỏi không có quyền.
    `;
    const answerSession = model.startChat({ generationConfig });
    const answerResult = await answerSession.sendMessage(answerPrompt);
    const textAnswer = answerResult.response.text().trim();
    console.log("🔍 Câu trả lời sinh ra:", textAnswer);

    res.json({ query: sqlQuery, answer: textAnswer, data: queryResult });
  } catch (error) {
    console.error("❌ Lỗi xử lý:", error);
    res.status(500).json({ error: "Lỗi xử lý AI hoặc SQL" });
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
