// prompt.js

// Nội dung cấu trúc cơ sở dữ liệu (theo DB_NCKH.docx)
const dbSchema = `
Bảng 1 Mô tả bảng user 
- id: bigint (ID, khóa chính)
- address: varchar (Địa chỉ)
- block: bit (Trạng thái tài khoản có bị khóa hay không)
- password: varchar (Password của tài khoản)
- phone: varchar (Số điện thoại)
- full_name: varchar (Họ tên người dùng)
- email: varchar (Email tài khoản)
- b64: longtext (Avatar)
- file_type: varchar (Kiểu dữ liệu ảnh)
- balance: double (Số dư tài khoản)

Bảng 3 Mô tả bảng role
- id: bigint (ID role, khóa chính)
- role_name: varchar (Tên role)

Bảng 4 Mô tả bảng user_roles
- user_id: bigint (ID người dùng, khóa ngoại tham chiếu tới user)
- role_id: bigint (ID role, khóa ngoại tham chiếu tới role)

Bảng 5 Mô tả bảng permission
- id: bigint (ID permission, khóa chính)
- permission_name: varchar (Tên permission)
- description: varchar (Mô tả quyền)

Bảng 6 Mô tả bảng role_permissions
- role_id: bigint (ID role, khóa ngoại)
- permission_id: bigint (ID permission, khóa ngoại)

Bảng 7 Mô tả bảng post
- id: bigint (ID, khóa chính)
- approved: bit (Tình trạng bài viết đã được duyệt hay chưa)
- content: varchar (Nội dung bài viết)
- create_at: datetime (Thời gian tạo bài viết)
- del: bit (Tình trạng bài viết đã ẩn hay chưa)
- last_update: datetime (Lần cập nhật thông tin cuối cùng)
- not_approved: bit (Tình trạng bài viết không được duyệt)
- title: varchar (Tiêu đề bài viết)
- user_id: bigint (ID người dùng - chủ post)

Bảng 8 Mô tả bảng accomodation
- id: bigint (ID, khóa chính)
- acreage: double (Diện tích)
- address: varchar (Địa chỉ)
- air_conditioner: bit (Tình trạng có điều hòa hay không)
- interior: bit (Đầy đủ nội thất hay phòng trống)
- electric_price: double (Giá điện)
- heater: bit (Tình trạng có máy nước nóng lạnh không)
- internet: bit (Tình trạng có internet hay không)
- motel: varchar (Loại: "O_GHEP" hoặc "PHONG_TRO")
- parking: bit (Có chỗ để xe riêng hay không)
- price: double (Giá cho thuê)
- owner: bit (Tình trạng Chung chủ hay không)
- toilet: bit (Tình trạng toilet (vệ sinh khép kín không))
- time: bit (Giờ giấc thoải mái không)
- water_price: double (Giá nước)

- district_id: bigint (ID khu vực, khóa ngoại)
- post_id: bigint (ID tin đăng, khóa ngoại)
- Kitchen: bit (Có kệ bếp không)
- Security: bit (An ninh tốt không)
- gender: bit (Giới tính yêu cầu: true - Nam, false - Nữ, null - Không yêu cầu)

Bảng 9 Mô tả bảng image
- id: bigint (ID, khóa chính)
- data: longblob (Hình ảnh bài viết)
- file_name: varchar (Tên hình ảnh)
- file_type: varchar (Kiểu dữ liệu ảnh)
- post_id: bigint (ID tin đăng, khóa ngoại)

Bảng 10 Mô tả bảng comment
- id: bigint (ID, khóa chính)
- content: varchar (Nội dung bình luận)
- last_update: datetime (Lần cập nhật bình luận cuối cùng)
- post_id: bigint (ID tin đăng, khóa ngoại)
- user_id: bigint (ID người dùng, khóa ngoại)
- rate: bigint (Số sao đánh giá)

Bảng 11 Mô tả bảng district (khu vực)
- id: bigint (ID, khóa chính)
- name: varchar (Tên khu vực)


Bảng 12 Mô tả bảng action
- id: bigint (ID, khóa chính)
- post_id: bigint (ID tin đăng, khóa ngoại)
- user_id: bigint (ID người dùng, khóa ngoại)
- action: varchar (Tên hành động)
- time: datetime (Thời gian tạo)

Bảng 15 Mô tả bảng recharge
- id: bigint (ID giao dịch, khóa chính)
- user_id: bigint (ID người dùng, khóa ngoại)
- amount: double (Số tiền nạp)
- qr_code: varchar (Thông tin mã QR)
- status: varchar (Trạng thái giao dịch: Pending, Completed)
- create_at: datetime (Thời gian tạo giao dịch)
- complete_at: datetime (Thời gian giao dịch hoàn thành)

Bảng 16 Mô tả bảng recharge_history
- id: bigint (ID lịch sử giao dịch, khóa chính)
- recharge_id: bigint (ID giao dịch, khóa ngoại)
- user_id: bigint (ID người dùng, khóa ngoại)
- action: varchar (Hành động: ví dụ "Nạp tiền", "Hoàn thành")
- action_time: datetime (Thời gian thực hiện hành động)
`;

// Xuất hàm nhận vào câu hỏi của người dùng và trả về prompt đã được kết hợp
module.exports = function (userQuestion) {
  return `
Hãy phân tích và hiểu chi tiết cấu trúc cơ sở dữ liệu dưới đây và sử dụng thông tin đó để tạo ra câu lệnh SQL trả lời cho câu hỏi của người dùng.
Cấu trúc cơ sở dữ liệu:
${dbSchema}

Câu hỏi: ${userQuestion}

Trả lời dưới dạng câu lệnh SQL.
`;
};
