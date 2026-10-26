# Aethelgard — extracted asset pack

## Nội dung và mức độ sẵn sàng

PNG RGBA được cắt trực tiếp từ ảnh 1536 × 1024, không resize, không làm mịn và không vẽ lại. Xem `contact-sheet.png` để chọn ảnh; dùng `manifest.json` làm nguồn danh mục. Đây là bộ asset trích xuất để dựng thử và rà soát, chưa phải tileset hoàn chỉnh đã kiểm thử trong game.

Các thư mục dưới `assets/`: `terrain/stone`, `terrain/mixed`, `architecture/ruins`, `architecture/buildings`, `nature/trees`, `nature/plants`, `nature/rocks`, `props/outdoor`, `props/interior`, `props/dungeon`, `props/banners`, `equipment/weapons`, `equipment/armor`, `equipment/clothing`, `items/potions`, `items/materials`, `effects/static`.

## Giới hạn cần biết

- Sprite chạm/chồng lấn: không có dữ liệu pixel của phần bị che để khôi phục chính xác. Một số cụm kiến trúc, đá, mũi tên và đồ nhỏ được giữ chung. Vùng cắt chật hoặc có mảnh lân cận cần rà soát; tất cả entry ghi `needs-visual-review`. Không tự coi mỗi PNG là một vật phẩm riêng đã xác định chức năng.
- Chữ nhãn: các hàng tiêu đề và đường trang trí được loại bằng vùng cắt; không dùng OCR hay tái tạo phần bị chữ che. Nếu còn mảnh trang trí sát vật thể, cần xử lý thủ công.
- Tile chưa seamless: chưa kiểm chứng nối mép; kích thước không đồng nhất và không nằm trên lưới 16/32/48 px. `seamless: false` nghĩa là chưa được chứng nhận dùng lặp. Đừng dùng như atlas autotile, terrain collision hay tilemap hoàn chỉnh.
- Nền trong suốt: chỉ pixel gần đen (mọi kênh RGB ≤ 12) nối ra mép vùng cắt được thay alpha=0. Chi tiết tối bên trong được giữ nguyên. Vì vậy có thể còn nền đen bị bao kín hoặc viền tối. Không xóa mọi pixel tối vì sẽ phá chi tiết.
- Glow/khói: đã hòa vào nền đen trong ảnh nguồn nên không thể phục hồi alpha nguyên bản; có thể thấy viền đen trên nền sáng. Hiệu ứng là ảnh tĩnh, không phải spritesheet animation. Chỉ thử chế độ cộng sáng nếu engine hỗ trợ và kết quả phù hợp.
- Pixel sắc nét: giữ pixel nguồn không có nghĩa ảnh gốc là pixel art theo lưới chuẩn. Không suy ra animation, collision, pivot hay kích thước thế giới từ crop.

## Tích hợp web

Chép thư mục pack vào thư mục public/static thích hợp của dự án, ví dụ `public/assets/aethelgard/`, bao gồm manifest và thư mục `assets/` bên trong. Với ví dụ này base URL là `/assets/aethelgard/`; mỗi `path` trong manifest là đường dẫn tương đối tính từ thư mục chứa manifest. Nếu ứng dụng chạy dưới subpath, lấy base URL từ cấu hình dự án, không hardcode `/`.

```js
const base = new URL('assets/aethelgard/', document.baseURI);
const manifest = await fetch(new URL('manifest.json', base)).then(r => {
  if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
  return r.json();
});
const byId = new Map(manifest.assets.map(a => [a.id, a]));
const assetUrl = id => {
  const asset = byId.get(id);
  if (!asset) throw new Error(`Unknown asset: ${id}`);
  return new URL(asset.path, base).href;
};
// Ví dụ: image.src = assetUrl('equipment-weapons-weapon-top-01');
```

```css
.pixel-art { image-rendering: pixelated; }
```

Canvas: đặt `ctx.imageSmoothingEnabled = false` sau khi tạo hoặc resize canvas. Với engine, tắt texture filtering/mipmap theo API hiện có. Ưu tiên phóng số nguyên, tránh scale phân số; không ép mọi ảnh thành cùng chiều rộng/cao. Căn pivot từng loại khi tích hợp (cây/nhà thường ở chân, icon thường ở tâm), không coi đây là dữ liệu có sẵn.

## Manifest

`id` ổn định trong pack này; `path`, `width`, `height`, `category`, `sourceRect`, `notes`, `status`, `sha256`. `sourceRect` là hình chữ nhật sau khi trim lề trong ảnh nguồn; không phải tọa độ atlas runtime. Kích thước PNG đã được đối chiếu manifest. `seamless: null` nghĩa là không áp dụng; `false` là chưa chứng nhận seamless.

## Sắp xếp dự án

Đọc `PROMPT-REORGANIZE-ASSETS.md` và đưa cho agent có quyền truy cập mã nguồn. Pack này chưa sửa code của dự án vì chưa kiểm tra repository hay framework của game. Agent cần khảo sát trước, dùng Git diff để rà soát, cập nhật đường dẫn và kiểm thử trước khi xóa bản cũ.

