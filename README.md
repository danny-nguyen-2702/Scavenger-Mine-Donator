# Công cụ Donation Scavenger Mine

Một công cụ toàn diện để tự động hóa việc chuyển nhượng token NIGHT từ nhiều địa chỉ ví đến các địa chỉ nhận được chỉ định thông qua Scavenger Mine API.

## Tính năng của tool

- ✅ **Đọc thông tin từ CSV**: Đọc seed phrase và địa chỉ nhận từ file donor_wallets.csv
- ✅ **Lựa chọn tài khoản ví linh hoạt**: Chỉ định chỉ mục (index) của từng tài khoản hoặc theo khoảng (ví dụ: "0-49" hoặc "0, 5, 10-15")
- ✅ **Hỗ trợ hoàn tác lệnh gom trước đó**: Hoàn tác donation trước đó bằng cách để trống địa chỉ nhận
- ✅ **Xử lý hàng loạt**: Xử lý nhiều seed phrase với nhiều tài khoản ví cùng lúc
- ✅ **Tích hợp API**: Tự động gửi donation đến Scavenger Mine API
- ✅ **Báo cáo Excel**: Tạo báo cáo Excel chi tiết với tóm tắt và chi tiết giao dịch
- ✅ **File báo cáo có lưu mốc thời gian**: Mỗi file báo cáo được lưu với mốc thời gian duy nhất. Người dùng có thể xem lại file cũ.
- ✅ **Xử lý lỗi**: Xử lý lỗi với thông báo lỗi chi tiết
- ✅ **Theo dõi tiến trình**: Cập nhật tiến trình theo thời gian thực trong quá trình xử lý
- ✅ **Giới hạn tốc độ**: Độ trễ tích hợp để tránh giới hạn API

## Yêu cầu tiên quyết

- Node.js phiên bản 16 trở lên
- npm hoặc yarn package manager
- Truy cập vào Scavenger Mine API (https://scavenger.prod.gd.midnighttge.io)

## Cài đặt

1. Clone hoặc tải về repository này

2. Cài đặt các dependencies:

```bash
npm install
```

## Thiết lập

1. Tạo file `donor_wallets.csv` trong cùng thư mục với cấu trúc sau:

```csv
seed phrase,account indexes,recipient address
seed phrase của bạn ở đây,0-49,addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
seed phrase khác,"0, 1, 5, 10-15, 20, 25-35",addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
seed phrase để hoàn tác,0-9,
```

**Định dạng file CSV:**

- `seed phrase`: Cụm từ ghi nhớ mnemonic (24 từ)
- `account indexes`: Chỉ số tài khoản cần xử lý, hỗ trợ hai định dạng:
  - Chỉ số riêng lẻ: `"0, 3, 6, 7, 12"` (phân tách bằng dấu phẩy)
  - Khoảng: `"0-49"` (xử lý tài khoản từ 0 đến 49)
  - Kết hợp: `"0, 5, 10-15, 20, 25-35"` (kết hợp riêng lẻ và khoảng)
- `recipient address`: Địa chỉ Cardano sẽ nhận token NIGHT đã hợp nhất
  - Để trống để hoàn tác donation trước đó (tự chuyển nhượng)
  - Cũng có thể dùng từ "self" để chỉ tự chuyển nhượng

Xem ví dụ về file donor_wallets.csv ở đây: https://docs.google.com/spreadsheets/d/1ZlMicJPCqZBvqUZZg88RpM-VzhCicwwh414R9w8RFQI/edit?usp=sharing
Bạn có thể tạo 1 bản copy từ file ví dụ bên trên, chỉnh sửa lại thông tin cho phù hợp với mục đích sử dụng của bạn. Rồi tải file về theo định dạng csv. Đổi lại tên file thành `donor_wallets.csv`

## Định dạng chỉ số tài khoản

Công cụ hiện hỗ trợ chỉ định chỉ số tài khoản linh hoạt:

### Chỉ số riêng lẻ

```csv
seed phrase,account indexes,recipient address
seed của bạn,0,addr1...
seed của bạn,"0, 5, 10",addr1...
```

### Định dạng khoảng

```csv
seed phrase,account indexes,recipient address
seed của bạn,0-49,addr1...
seed của bạn,100-199,addr1...
```

### Định dạng kết hợp

```csv
seed phrase,account indexes,recipient address
seed của bạn,"0-9, 15, 20-29, 50",addr1...
```

### Tự donate cho chính nó (Hoàn tác)

Để hoàn tác lệnh donation trước đó, để trống địa chỉ nhận:

```csv
seed phrase,account indexes,recipient address
seed của bạn,0-49,
```

## Cách sử dụng

Chạy công cụ donation:

```bash
npm start
```

hoặc

```bash
node donator.js
```

## Đầu ra

Công cụ tạo file Excel có dấu thời gian (ví dụ: `donation_results_20240315_143022.xlsx`) với hai sheet:

### Sheet 1: Tóm tắt

- Tổng quan về mỗi seed phrase được xử lý
- Chỉ số tài khoản đã sử dụng
- Tổng số tài khoản mỗi seed
- Số lượng thành công/thất bại
- Phần trăm tỷ lệ thành công
- Tổng cộng ở cuối

### Sheet 2: Chi tiết

- Thông tin chi tiết cho mỗi lần thử donation
- Bao gồm địa chỉ donor, địa chỉ nhận, chữ ký
- Loại thao tác (Donation hoặc Hoàn tác)
- Phản hồi API đầy đủ
- Thông báo lỗi cho các giao dịch thất bại
- Chỉ báo thành công/thất bại có mã màu
- Đánh dấu màu cam cho các thao tác hoàn tác

## Cách hoạt động

1. **Phân tích CSV**: Đọc file `donor_wallets.csv` để lấy seed phrase và địa chỉ nhận

2. **Phân tích chỉ số tài khoản**: Xử lý chuỗi chỉ số tài khoản để xác định tài khoản nào cần sử dụng

   - Phân tích các số riêng lẻ và khoảng
   - Loại bỏ trùng lặp và sắp xếp danh sách

3. **Tạo địa chỉ**: Với mỗi seed phrase, tạo địa chỉ ví dựa trên chỉ số tài khoản đã chỉ định

4. **Ký xác nhận**: Ký xác nhận donation cho mỗi địa chỉ donor:

   ```
   Assign accumulated Scavenger rights to: <địa_chỉ_nhận>
   ```

   Với tính năng tự chuyển nhượng (hoàn tác), địa chỉ nhận giống với địa chỉ donor.

5. **Gửi API**: Gửi mỗi donation đến Scavenger Mine API endpoint:

   ```
   POST /donate_to/<recipient>/<donor>/<signature>
   ```

6. **Theo dõi kết quả**: Ghi lại phản hồi API và xác định thành công/thất bại dựa trên:

   - Mã trạng thái HTTP 200
   - Body phản hồi chứa `status: "success"`

7. **Tạo báo cáo Excel**: Tạo báo cáo Excel toàn diện với tất cả kết quả, lưu với dấu thời gian

## Tiêu chí thành công

Một donation được coi là thành công khi:

- API trả về mã trạng thái HTTP 200
- JSON phản hồi chứa `"status": "success"`

Tất cả các trường hợp khác được đánh dấu là thất bại với thông báo lỗi được ghi lại.

## Xử lý lỗi

Công cụ bao gồm xử lý lỗi toàn diện cho:

- Định dạng CSV không hợp lệ
- Định dạng chỉ số tài khoản không hợp lệ (ví dụ: "abc", "10-5")
- Lỗi tạo địa chỉ
- Lỗi ký thông điệp
- Vấn đề giao tiếp API
- Timeout mạng (timeout mặc định 30 giây mỗi lần gọi API)

## Giới hạn tốc độ

Công cụ bao gồm độ trễ 1.5 giây giữa các lần gọi API để tránh vấn đề giới hạn tốc độ.

## Lưu ý bảo mật

⚠️ **Cân nhắc bảo mật quan trọng:**

1. **Bảo mật Seed Phrase**: Giữ file `donor_wallets.csv` của bạn an toàn và không bao giờ chia sẻ
2. **Nội dung báo cáo bị cắt ngắn**: Seed phrase bị cắt ngắn trong log và báo cáo vì lý do bảo mật
3. **Xử lý cục bộ**: Tất cả các thao tác mã hóa được thực hiện cục bộ
4. **Bảo mật API**: Chỉ gửi chữ ký đến API, không gửi seed phrase

## File đầu ra có dấu thời gian

Mỗi lần chạy tạo một file đầu ra có tên duy nhất với định dạng:

```
donation_results_YYYYMMDD_HHMMSS.xlsx
```

Ví dụ: `donation_results_20240315_143022.xlsx`

Điều này đảm bảo bạn không bao giờ vô tình ghi đè kết quả trước đó và có thể duy trì lịch sử của tất cả các hoạt động donation.

## Khắc phục sự cố

### Vấn đề thường gặp

1. **"Không tìm thấy file CSV"**

   - Đảm bảo `donor_wallets.csv` tồn tại trong cùng thư mục với script

2. **"Chỉ số tài khoản không hợp lệ"**

   - Kiểm tra chỉ số tài khoản là số hoặc khoảng hợp lệ
   - Khoảng phải ở định dạng "bắt*đầu-kết_thúc" với bắt*đầu ≤ kết_thúc
   - Chỉ số riêng lẻ phải được phân tách bằng dấu phẩy

3. **"Độ dài khóa công khai không hợp lệ"**

   - Kiểm tra seed phrase hợp lệ (24 từ từ danh sách từ BIP39)

4. **API timeout**

   - Kiểm tra kết nối internet của bạn
   - Xác minh API endpoint có thể truy cập
   - Cân nhắc tăng timeout trong code (mặc định: 30 giây)

5. **"Địa chỉ chưa được đăng ký"**

   - Đảm bảo địa chỉ của ví cho (donor) và vì nhận (recipient) đã được đăng ký với Scavenger Mine trước

6. **"Địa chỉ gốc đã có chỉ định donation đang hoạt động"**
   - Địa chỉ này đã được chỉ định để donate cho địa chỉ khác
   - Để sửa: Để trống địa chỉ nhận để hoàn tác chỉ định trước đó trước

## Ví dụ phản hồi API

### Donation thành công

```json
{
  "status": "success",
  "message": "Successfully assigned accumulated Scavenger rights from addr1... to addr1...",
  "donation_id": "123e4567-e89b-12d3-a456-426614174000",
  "solutions_consolidated": 5
}
```

### Hoàn tác thành công (Tự chuyển nhượng)

```json
{
  "status": "success",
  "message": "Successfully undid donation assignment for addr1...",
  "solutions_consolidated": 0
}
```

### Donation thất bại

```json
{
  "statusCode": 400,
  "message": "Original address is not registered",
  "error": "Bad Request"
}
```

## Ví dụ

### Ví dụ 1: Khoảng đơn giản

Xử lý tài khoản 0-99 cho một seed phrase:

```csv
seed phrase,account indexes,recipient address
seed phrase của bạn ở đây,0-99,addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
```

### Ví dụ 2: Tài khoản cụ thể

Chỉ xử lý các tài khoản cụ thể:

```csv
seed phrase,account indexes,recipient address
seed phrase của bạn ở đây,"0, 5, 10, 15, 20",addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
```

### Ví dụ 3: Định dạng kết hợp

Kết hợp khoảng và chỉ số riêng lẻ:

```csv
seed phrase,account indexes,recipient address
seed phrase của bạn ở đây,"0-9, 15, 20-29, 50, 100-110",addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
```

### Ví dụ 4: Hoàn tác donation trước đó

Để trống địa chỉ nhận để hoàn tác donation:

```csv
seed phrase,account indexes,recipient address
seed phrase của bạn ở đây,0-49,
```

### Ví dụ 5: Thao tác hỗn hợp

Một số donation và một số hoàn tác:

```csv
seed phrase,account indexes,recipient address
seed một,0-49,addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
seed hai,0-9,
seed ba,"5, 10, 15",addr1q9exzqlgakcxxac9mu74zjpzr2ha90yktuc6xpp57tz58u68nfqqsdtksuyg5enhcag6ul96ufmf6ce3p84fz34ny0fs78s482
```

## Giấy phép

MIT

## Hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi:

1. Kiểm tra thông báo lỗi trong báo cáo Excel
2. Xem lại đầu ra console để biết thông tin lỗi chi tiết
3. Xác minh định dạng file CSV của bạn khớp với các ví dụ
4. Đảm bảo tất cả địa chỉ donor đã được đăng ký với Scavenger Mine
5. Với thao tác hoàn tác, đảm bảo địa chỉ có donation đang hoạt động để hoàn tác

