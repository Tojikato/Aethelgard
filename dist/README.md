# The Gates of Aethelgard

Complete buildless HTML/CSS/native ES6 game with Firebase 9.23 modular and Phaser 3.80.1. Serve `dist/` over HTTP, not file://. Example: `python -m http.server 4173 --directory dist`.

## Firebase setup

The supplied public Firebase web configuration is already in `dist/app.js`.
1. Enable Email/Password under Firebase Authentication → Sign-in method.
2. Create the default Cloud Firestore database in Native mode.
3. Publish `firestore.rules` in the Firebase Firestore rules editor (merge deliberately if this database has other applications).
4. Add your deployed hostname and `localhost` to Authentication → Settings → Authorized domains. Deployment hostname: `aethelgard-abyssal-gate.magicduck64.chatgpt.site`.

Registration and sign-in use real Firebase accounts. Profiles are created transactionally in `users/{uid}`, without resetting existing stats. Failed profile creation can be retried by signing in; the authentication account may already exist. Name submission waits for a successful Firestore update before continuing. Rules permit only the owner to read the profile and edit their name; future gameplay stat changes need trusted server logic or new rules.

“Witness the awakening” is an explicitly unsaved preview: it creates no account and makes no Firestore writes. Use Continue, Enter, or Space to advance; advancing while text types reveals that line. After the fourth line, enter a name. The final line leads to the white flash, black fade, and Ashen Hamlet title. The hamlet is a completion screen for this requested prologue, not an additional game module.

CDN access is needed for Firebase, Phaser, and optional Google Fonts; serif fallbacks are provided. No administrative Firebase credentials were supplied, so provider enablement, database rules, and a real account round trip must be verified in your Firebase project.

## Asset Pack & Hệ thống Đồ họa (Namespace `aethelgard`)

Bộ asset pack gồm 236 asset pixel art RGBA được tích hợp trực tiếp vào game dưới namespace `assets/aethelgard/`.

### 1. Cấu trúc thư mục & 17 Nhóm Phân Loại
```
dist/assets/aethelgard/
├── manifest.json            # Catalog metadata của 236 asset (ID, path, dimensions, SHA-256)
├── validation.json          # Báo cáo kiểm định toàn vẹn
├── contact-sheet.png        # Bảng tổng hợp thị giác toàn bộ asset
├── terrain/
│   ├── stone/               # 16 khối đá lát, bậc thềm, nền đá
│   └── mixed/               # 22 khối nền hỗn hợp, đất sỏi, cỏ rêu
├── architecture/
│   ├── ruins/               # 7 cột đổ nát, tường gạch vỡ
│   └── buildings/           # 7 tháp canh, cổng đá, mái vòm
├── nature/
│   ├── trees/               # 4 cây khô, cây tùng, đại thụ
│   ├── plants/              # 10 bụi cây, dây leo, hoa độc
│   └── rocks/               # 6 tảng đá tảng, mỏm đá nhọn
├── props/
│   ├── outdoor/             # 9 biển báo, đèn lồng, thùng gỗ, xe kéo
│   ├── interior/            # 13 bàn sách, kệ rượu, giá nến, rương
│   ├── dungeon/             # 11 đỉnh lửa brazier, xiềng xích, lồng sắt
│   └── banners/             # 4 cờ hiệu phù hiệu lãnh chúa
├── equipment/
│   ├── weapons/             # 21 vũ khí (rìu, chùy, búa, liềm, cung, trượng phép)
│   ├── armor/               # 29 giáp trụ, khiên tròn, mũ sắt
│   └── clothing/            # 16 áo choàng lữ hành, mũ trùm, găng tay da
├── items/
│   ├── potions/             # 6 bình độc dược, huyết thanh, tinh chất
│   └── materials/           # 33 quặng kim loại, ngọc thạch, da thú, xương quái
└── effects/
    └── static/              # 22 hiệu ứng tĩnh rune ma thuật, quầng sáng, ấn chú
```

### 2. Quy ước đặt tên & Base URL
- **Quy ước tên file & ID:** `lowercase-kebab-case` (ví dụ: `nature-trees-dead-tree`, `dead-tree.png`).
- **Base URL:** Mặc định `./assets/aethelgard/`, tính tương đối theo `document.baseURI` nhằm đảm bảo tương thích hoàn hảo khi deploy trên root domain hoặc bất kỳ subpath nào (ví dụ: `/my-game/dist/`).
- **Không lặp thư mục:** Đường dẫn chuẩn hóa trực tiếp `<category>/<file>.png`, loại bỏ hoàn toàn tình trạng lặp `assets/assets`.

### 3. Asset Registry Service & Phaser Loader
Game tích hợp service trung tâm [`dist/src/services/assetRegistry.js`](file:///E:/Aethelgard/abyssal-gate/dist/src/services/assetRegistry.js):
```js
import { assetRegistry } from '../services/assetRegistry.js';

// Khởi tạo trong Boot scene từ cache JSON đã preload:
assetRegistry.init(this);

// Lấy metadata theo asset ID:
const meta = assetRegistry.get('nature-trees-dead-tree');

// Lấy URL giải quyết tương đối:
const url = assetRegistry.getUrl('equipment-weapons-axe');

// Tải hàng loạt toàn bộ category trong loader:
assetRegistry.preloadCategory(this, 'equipment/weapons');
```

### 4. Quy trình thêm Asset mới
1. Đặt file PNG RGBA vào đúng thư mục nhóm tương ứng dưới `dist/assets/aethelgard/<nhóm>/`.
2. Đặt tên file theo chuẩn `lowercase-kebab-case.png`.
3. Khai báo entry trong `dist/assets/aethelgard/manifest.json` gồm: `id`, `name`, `path`, `width`, `height`, `category`, `sourceRect`, `seamless`, `status`, `sha256`.
4. Nếu asset là vũ khí/trang bị/vật phẩm người chơi, đăng ký thông số RPG vào [`dist/src/config/items.js`](file:///E:/Aethelgard/abyssal-gate/dist/src/config/items.js).

### 5. Các Giới Hạn Kỹ Thuật Cần Lưu Ý
- **Tile chưa Seamless:** Các ô đất/đá có kích thước từ $53\times 54$ đến $66\times 69$ px (không theo lưới chuẩn $16/32/48$ px) và có cờ `seamless: false`. Không sử dụng làm auto-tile map lặp lại mà không xử lý mép thủ công.
- **Kênh Alpha & Nền Đen:** Nền trong suốt được lọc từ pixel gần đen nối ra viền. Các chi tiết khói/glow hòa vào nền tối nguyên bản cần dùng blend mode cộng sáng (`Phaser.BlendModes.ADD`) hoặc hiển thị trên nền tối.
- **Nearest-Neighbor Filtering:** Canvas Phaser đã cấu hình `pixelArt: true` và CSS `.pixel-art { image-rendering: pixelated; }` để đảm bảo đồ họa pixel sắc nét tuyệt đối, tránh hiện tượng mờ nhòe do nội suy phân số.

