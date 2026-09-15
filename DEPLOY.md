# Deploy website/ lên Cloudflare Pages (free, không cần mua domain).

## Chuẩn bị (agent đã làm sẵn — chạy smoke test trước khi deploy)
```
python scripts/verify_website.py
```
Phải PASS hết mới deploy: check file bắt buộc, asset refs, form markup,
VN phone parity với assets/js/main.js, utm_campaign capture, lệnh deploy.

## Deploy (1 lần, cần NGƯỜI — OAuth browser, agent không tự login được)
```
npx wrangler login
npx wrangler pages deploy website --project-name vayvonhanh --commit-dirty=true
```
Lần đầu: wrangler tạo project + gán URL https://vayvonhanh.pages.dev
Deploy sau: cùng lệnh trên (Pages giữ URL, mỗi deploy có preview URL riêng).

## Sau deploy — verify
```
curl -s -o NUL -w "%{http_code}\n" https://vayvonhanh.pages.dev/
python scripts/verify_website.py   # vẫn PASS (độc lập với live URL)
```
Mở tay: form #dang-ky (index.html) submit SĐT 0901234567 → hiện "Đã nhận
đăng ký", DevTools console có dòng [LEAD_JSONL], ?utm_campaign=TEST vẫn
được capture vào JSON.

## Bio link (sau khi site live)
TikTok bio → https://vayvonhanh.pages.dev/?utm_source=tiktok&utm_medium=bio
Mỗi video dùng link kèm campaign riêng khi share/comment:
  https://vayvonhanh.pages.dev/?utm_source=tiktok&utm_medium=video&utm_campaign=<video_uid>
(video_uid có sẵn trong outputs sidecar JSON — xem pipeline.py meta['utm'].)
Khi nào mua domain vayvonhanh.vn thì vào Cloudflare Dashboard > Pages >
vayvonhanh > Custom domains > thêm vào.

## Lead flow (chưa có backend)
form submit -> validate SĐT VN -> queue localStorage + console [LEAD_JSONL]
operator mở DevTools copy dòng JSON vào website/leads.jsonl mỗi ngày.
Khi cần realtime: set LEAD_ENDPOINT trong website/assets/js/main.js
thành URL Google Apps Script / Formspree / worker Cloudflare rồi redeploy.
