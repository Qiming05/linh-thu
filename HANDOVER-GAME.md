# Linh Thú Hán Tự — Tài liệu bàn giao (dành cho AI hoặc lập trình viên tiếp theo)

> **Đọc file này trước, rồi mở `game/index.html`.** Toàn bộ game nằm trong một file HTML duy nhất (khoảng 1.500 dòng, JS thuần, không build).
> Cập nhật: 22/11/2026.

---

## 1. Game là gì

RPG pixel nhập vai học tiếng Trung, dành cho **người Việt đang học giáo trình MSUTONG 2 (khoảng HSK2)**.

- Mỗi bài học (file JSON) mở ra **một vùng đất mới** có bản đồ, linh thú và trưởng vùng riêng.
- Đánh nhau với linh thú bằng cách **trả lời câu hỏi từ vựng**. Câu hỏi đi theo lịch ôn tập ngắt quãng (SRS).
- Bắt linh thú bằng **Linh Châu**. Mua châu ở tiệm hoặc rèn ở lò rèn, mỗi lần đều kèm mini game.
- Toàn bộ giao diện là **tiếng Việt**. Nội dung học là **tiếng Trung giản thể kèm pinyin**.

### Người dùng (quan trọng khi thiết kế)
- Người Việt, **không học viết và đọc chữ Hán**. Họ học **nghe, nói, pinyin và nghĩa tiếng Việt**.
- Vì vậy **mọi chữ Hán trên màn hình đều phải có pinyin** (đã làm tự động, xem mục 6.10).
- Mặc định bắt linh thú và rèn châu bằng cách **đọc nghĩa tiếng Việt rồi gõ pinyin**, không bắt viết chữ.
- Thích chơi toàn màn hình, thích thêm nhiều mini game và nhiệm vụ phụ.

---

## 2. Cách chạy

```bash
cd vo-chu-han-handover/game
python -m http.server 8931 --bind 127.0.0.1
```
Mở http://127.0.0.1:8931/

- Thư mục `game/` là **gốc của website** và cũng là **kho git**. Mọi thứ game cần đều nằm trong đó, không có đường dẫn `../`.

- **Phải chạy qua server.** Mở bằng `file://` thì canvas không đọc được ảnh sprite và nút "Nạp bài mẫu" không fetch được JSON.
- Cần mạng cho 2 thư viện tải từ CDN jsDelivr:
  - `hanzi-writer@3.5.0`: dùng để viết nét chữ.
  - `pinyin-pro@3.26.0`: tự sinh pinyin.

  Không có mạng thì game vẫn chạy, chỉ mất 2 tính năng này.
- Tiến trình lưu trong `localStorage`, khóa **`lthn-v1`**. **Khi thử nghiệm:** sao lưu khóa này trước, rồi khôi phục lại sau, để không phá tiến trình thật của người dùng.

---

## 3. Cấu trúc thư mục

```
vo-chu-han-handover/
├─ HANDOVER.md              ← spec của app "Vở Chữ Hán" (sinh bài học từ vở ghi). KHÔNG phải game này.
├─ game/                   ← GỐC WEBSITE + KHO GIT
│  ├─ index.html            ← TOÀN BỘ GAME (HTML + CSS + JS)
│  ├─ sw.js                 ← service worker (chạy offline, tự cập nhật)
│  ├─ manifest.webmanifest, icons/  ← cài như app trên điện thoại (PWA)
│  ├─ assets/kenney-tiny-town/, assets/kenney-tiny-creatures/ ← 3 ảnh tilemap game dùng (+ License)
│  ├─ HANDOVER-GAME.md, README.md
│  ├─ lessons/msutong2-phan-01..10.json   ← 10 bài mẫu
│  ├─ sprites/m1..m56_{front,back}[_alt].png ← 56 quái (isaiah658, CC0); _alt = dạng tiến hoá
│  ├─ sample-zone.html, tileviewer.html    ← công cụ cũ, không đưa lên git (.gitignore)
├─ assets/
│  ├─ kenney_tiny-town/     ← tileset bản đồ + nhân vật (CC0)
│  ├─ tiny-creatures/       ← 180 sinh vật nhỏ (CC0), cắt từ Tilemap/tilemap_packed.png
│  ├─ 50_monsters_pack_2d_version_1.0_0/
│  └─ _zips/                ← file zip gốc
├─ linh-thu-han-tu.html, cho-dem-han-tu.html, prototype/ ← bản cũ / prototype khác
```

---

## 4. Định dạng bài học (JSON)

```json
{
  "topic": "MSUTONG 2 · Phần 1: 听音乐、唱歌、打篮球…",
  "vocab": [{
    "hanzi": "听音乐", "pinyin": "tīng yīnyuè", "han_viet": "thính âm nhạc",
    "meaning": "nghe nhạc", "pos": "cụm động từ",
    "example": { "hanzi": "我喜欢听音乐。", "pinyin": "Wǒ xǐhuan tīng yīnyuè.", "meaning": "Tôi thích nghe nhạc." }
  }],
  "characters": [{ "char": "听", "han_viet": "thính" }],
  "dialogue":   [{ "role": "A", "zh": "...", "py": "...", "vi": "..." }]
}
```

- Khi nạp vào game, mỗi từ được chuyển thành dạng gọn `{h, p, v, m, eh, ep, em}`: hanzi, pinyin, Hán Việt, nghĩa, ví dụ hanzi, ví dụ pinyin, ví dụ nghĩa.
- Bài quá dài thì `askSplit` hỏi người dùng có muốn chia nhỏ không. Mỗi phần chỉ giữ những `characters` có mặt trong vocab của phần đó.
- Nạp bài: gặp **Thầy Vương** trong làng để nạp file JSON, hoặc bấm "Nạp bài mẫu".

---

## 5. Dữ liệu lưu `S` (localStorage `lthn-v1`)

| Trường | Ý nghĩa |
|---|---|
| `lessons[]` | Các bài đã nạp: `{id, title, vocab[], characters[], dialogue[], species[3]}` |
| `cards{hanzi}` | Thẻ SRS: `{step, interval, ease, reps, lapses, due}` |
| `intro{hanzi}` | Thời điểm học từ đó (ở Thầy giáo vùng) |
| `ans{hanzi}` | Thống kê trả lời `{c: đúng, n: tổng, rt: thời gian trung bình}`, dùng để tính sức mạnh |
| `written{char}` | Chữ đã viết đúng, hoặc đã gõ đúng pinyin. Cần cho bậc thăng hoa |
| `owned[]`, `team[]` | Linh thú đã bắt. Mỗi con trong đội có dạng `{n, lid, hp}` |
| `shiny[]` | Id những con màu lạ ✨ |
| `items` | `{tea, b1, b2, b3, shard}`: trà, Linh/Ngọc/Vương Châu, tinh thạch |
| `coins`, `badges[]`, `cleared{}`, `days{}`, `fairBest{}` | Tiền, huy hiệu tuần, trưởng vùng đã thắng, số câu trả lời mỗi ngày, điểm cao ở hội chợ |
| `where` | Vị trí người chơi `{map, x, y, dir}` |
| `nextMon`, `elV` | Bộ đếm id loài, phiên bản migration hệ Ngũ hành (đang là 3) |
| `sound`, `showPy`, `showVi`, `writeMode`, `big` | Các nút bật/tắt (mục 6.10) |

**Quy tắc:** trường mới phải có giá trị mặc định trong `fresh()` hoặc `ensureItems()`, hoặc phải đọc kiểu an toàn (ví dụ `S.showPy === false`). Đổi cấu trúc dữ liệu thì viết migration trong `migrateSpecies()` và tăng `elV`. **Tuyệt đối không làm mất tiến trình cũ.**

---

## 6. Các hệ thống (theo thứ tự trong `index.html`)

Các phần trong file được đánh dấu bằng `/* =============== tên =============== */`:
utils → save → words & SRS → species → lessons import → maps → player & input → rendering → UI → NPC scripts → Linh Châu → numbers → blacksmith → mini games → sheets → questions → battle → boot.

### 6.1 SRS (lịch ôn)
- `grade(card, g)` chấm 4 mức. Các bước ôn là `STEPS = [1, 3, 7, 30]` ngày. Trả lời sai thì ôn lại sau 10 phút.
- `mastery(hs)` cho biết mức thuộc của một nhóm từ, từ 0 đến 1.
- Chỉ những từ **đến hạn** mới được đổi lịch ôn.

### 6.2 Linh thú (species)
- Mỗi bài có 3 loài, tạo bằng `assignSpecies(L)`. Mỗi loài lấy **một chữ Hán có trong vocab của bài**, và chữ này không trùng với loài nào khác.
- Một loài có dạng `{n: id duy nhất, g: chữ, el: hệ, spr: hình, hue: độ xoay màu, name}`.
- 3 linh thú khởi đầu: Viêm Hồ 炎 (Hỏa), Thủy Kình 鲸 (Thủy), Mộc Long 龙 (Mộc).
- Hình của loài:
  - `spr` từ 1 đến 56: lấy từ `sprites/m{spr}_front.png`.
  - `spr` ≥ 1000: Tiny Creature số `spr - 1000`, cắt từ tilemap bằng canvas (`tinyURL`).
- Kho có 174 hình. `pickSprite(el)` chọn hình ít bị dùng nhất trong nhóm hình của hệ đó. Hình đã bị dùng thì đổi `hue` để khác màu.
- Hiện có **33 loài** (3 khởi đầu + 10 bài × 3).

### 6.3 Ngũ hành
- Hệ của linh thú lấy theo **bộ thủ** của chữ:
  - Tra bảng `EL_CHARS` trước.
  - Không thấy thì dò từ khóa trong nghĩa tiếng Việt (`EL_WORDS`).
  - Vẫn không thấy thì là hệ Nhân.
- Có 6 hệ: Thủy 氵, Mộc 木艹, Hỏa 火日, Kim 钅刂贝, Thổ 土辶足, Nhân 亻口讠 (trung tính).
- Vòng khắc: Thủy → Hỏa → Kim → Mộc → Thổ → Thủy.
  - Đánh hệ mình khắc: sát thương ×1.5.
  - Đánh hệ khắc mình: sát thương ×0.7.

### 6.4 Sức mạnh (`monStats`) — lấy từ việc học thật
- **Cấp** = 3 + mức thuộc × 20.
- **Công** tăng theo tỉ lệ trả lời đúng. **Thủ** tăng khi ôn đúng hạn. **Tốc** tăng khi trả lời nhanh, và cho tỉ lệ né đòn bằng Tốc/200.
- Có 3 bậc:
  - **Gốc**.
  - **Tiến hoá**: thuộc từ 80% (dùng hình `_alt`).
  - **Thăng hoa**: thuộc từ 95% và có `written[chữ]` (viền vàng phát sáng).
- Linh thú có nhiều từ đến hạn ôn sẽ bị "buồn ngủ".
- **Màu lạ:** tỉ lệ 1/40, tăng lên 1/12 nếu hôm nay đã trả lời đúng từ 30 câu. Hiển thị bằng `hue-rotate`.

### 6.5 Bản đồ
- Bản đồ là canvas 352×240, gồm 22×15 ô, mỗi ô 16px, dùng tile Kenney Tiny Town.
- Mỗi bài có một vùng riêng, tạo bằng `buildZone`.
- `themeOf(L)` dò từ khóa trong vocab để chọn chủ đề vùng: chợ, trường, công viên, phố ẩm thực, quảng trường, phố điện thoại, hoặc rừng (mặc định). `decorateZone` đặt vật trang trí theo chủ đề.
- **Lỗi đã gặp:** `blankMap` dùng chung một object cho mọi ô. Muốn sửa một ô thì phải gán object mới: `m[y][x] = {...m[y][x], key}`.
- Mỗi vùng có các NPC: Thầy giáo vùng (dạy từ) và Trưởng vùng (boss).
- NPC trong làng:

| NPC | Vị trí | Việc |
|---|---|---|
| Thầy Vương | (4,5) | Nạp bài, chọn linh thú khởi đầu |
| Bà quán trà | (11,5) | Hồi máu, nhiệm vụ hằng ngày |
| Người giữ đền | (18,5) | Thử thách tuần |
| Người dẫn đường | (11,8) | Dịch chuyển giữa các vùng |
| Chủ tiệm | (6,8) | Bán đồ |
| Người mở hội chợ | (16,8) | Mini game kiếm tiền |
| Thợ rèn | (13,12) | Rèn châu |
| Người phiên dịch | (8,8) | Luyện dịch cả câu, 5 cấp (`TR_LEVELS`): Trung→Việt chọn / xếp / tự gõ (mở sẵn); Việt→Trung xếp (mở khi đạt 4/5 ở Trung→Việt xếp hoặc tự gõ); Việt→Trung gõ pinyin cả câu (chấm `pyScore`, cần khớp 97%). Lưu ở `S.trans.best[5]`. Câu lấy từ câu ví dụ đã học và hội thoại bài (`transPool`) |

### 6.6 Trận đấu
- **Các dạng câu hỏi** (`makeQ`), mở dần theo bước SRS của từ:
  - `h2m`: nhìn chữ, chọn nghĩa.
  - `m2h`: nhìn nghĩa, chọn chữ.
  - `p2h`: nhìn pinyin, chọn chữ.
  - `tone`: chọn dấu thanh đúng.
  - `listen`: nghe rồi chọn.
  - `fill`: điền chỗ trống.
  - `order`: xếp câu.
  - `type`: gõ pinyin.
  - `z2v`: đọc câu ví dụ tiếng Trung, chọn bản dịch tiếng Việt (từ bước SRS 1).
  - `z2vt`: đọc câu tiếng Trung, xếp các mảnh tiếng Việt thành bản dịch (từ bước 2).
  - `z2vw`: đọc câu tiếng Trung, **tự gõ** bản dịch tiếng Việt (từ bước 2). Chấm bằng `viScore`: so khớp theo từ, có dấu hay không dấu đều được. Đạt từ 80% là đúng. Dưới mức đó thì hiện đáp án mẫu, người chơi có thể bấm "Mình dịch đúng ý" (đồng hồ tạm dừng). Chung hàm `typeGame`.
  - `order` (Việt → Trung, xếp chữ Hán) **chỉ xuất hiện từ bước 3**, vì đây là dạng khó nhất.
  - Mọi dạng xếp mảnh dùng chung `tileGame(box, toks, extra, sep, onDone, isDone)`. Câu tiếng Việt cắt bằng `viChunks` (tối đa 12 mảnh), câu tiếng Trung cắt bằng `zhToks`.
- Có thêm **Hô to** (nhận giọng nói của Chrome) và **Uống trà**.
- Sát thương tính từ hệ, Công, bậc và mức thuộc của từ vừa dùng làm chiêu.
- Hạ linh thú hoang được +5 tiền và 50% rơi tinh thạch. Thắng Trưởng vùng được +2 tinh thạch.

### 6.7 Bắt linh thú (Linh Châu)

| Châu | Tỉ lệ gốc | Cách có |
|---|---|---|
| b1 Linh Châu 灵珠 | 0.45 | Mua 15 tiền, hoặc rèn |
| b2 Ngọc Châu 玉珠 | 0.70 | Mua 35 tiền, hoặc rèn |
| b3 Vương Châu 王珠 | 0.95 | Chỉ rèn được |

- Công thức: `tỉ lệ = clamp(rate × (1.15 − 0.85 × hp/max) + (niệm chú ? 0.3 : 0) − (màu lạ ? 0.1 : 0), 0.05, 0.99)`.
- Có 2 lúc được ném châu:
  - Nút "Ném châu" trong trận. Ném hụt thì linh thú phản đòn.
  - Cơ hội cuối khi linh thú kiệt sức. Ném hụt thì nó chạy mất.
- **Niệm chú** (`writeCapture`) có 2 chế độ:
  - Mặc định: hiện nghĩa tiếng Việt, người chơi gõ pinyin.
  - Chế độ viết: viết chữ bằng HanziWriter.

### 6.8 Tiệm, lò rèn, hội chợ (mini game)
- **Tiệm** (`talkShop`, `shopBuy`):
  - Người chơi chọn câu tiếng Trung đúng tình huống để mua hàng.
  - 40% số lần có thêm **mặc cả** (`haggle`): chủ tiệm đọc giá bằng tiếng Trung, ví dụ 九块. Chọn đúng số thì được giảm 15–45%.
- **Lò rèn** (`talkSmith`, `forge`): cần đã học ít nhất 6 từ. Rèn hỏng thì không mất nguyên liệu.

  | Rèn ra | Nguyên liệu | Mini game |
  |---|---|---|
  | b1 ×2 | 1 tinh thạch | **Ghép từ** (`gameBuild`) |
  | b2 | 2 tinh thạch + 10 tiền | **Đoán hệ theo bộ thủ** (`gameElem`) |
  | b3 | 4 tinh thạch + 30 tiền | **Rèn nét** (`gameStroke`). Khi không bật chế độ viết thì thay bằng **Gọi tên kim loại** (`gamePyForge`): đọc nghĩa, gõ pinyin |

- **Hội chợ** (`talkFair`): Đúng hay Sai, Lật thẻ, Bắt chữ rơi. Chơi được tiền.
- Sổ Linh Thú có nút luyện viết, hoặc gõ pinyin, để đạt bậc thăng hoa (`practiceWrite`).

### 6.9 Giao diện chung
- `dialog(pages)`: hộp thoại NPC. Mỗi trang có dạng `{who, zh, py, vi, choices}`.
- `sheet(html, bind)`: bảng phủ toàn khung game.
- `toast(msg)`: thông báo nhỏ.
- `speak(zh)`: đọc tiếng Trung bằng Web Speech API.

### 6.10 Nút bật/tắt trên thanh công cụ
| Nút | Trường | Tác dụng |
|---|---|---|
| ⛶ Toàn màn hình | `S.big` | Thêm class `body.full`. Khung `#stage` giữ tỉ lệ 22:15. `#ov` được phóng to bằng CSS `zoom`, tối đa 2.4 lần (hàm `fitBig`). Ô viết chữ dùng `padFit` để tự bù lại mức zoom, nhờ vậy nét bút không lệch |
| Âm thanh | `S.sound` | Bật/tắt giọng đọc |
| Tiếng Việt | `S.showVi` | Ẩn bản dịch trong lời thoại NPC. Mỗi câu có nút "Xem nghĩa tiếng Việt" để mở riêng |
| Pinyin | `S.showPy` | Thêm class `body.nopy`, ẩn mọi phần tử `.py` (kể cả `rt.py`) |
| Bắt bằng | `S.writeMode` | Gõ pinyin (mặc định) hoặc viết chữ |

**Tự gắn pinyin cho mọi chữ Hán:**
- `annotate()` chạy qua một `MutationObserver` trên `document.body`.
- Mọi đoạn text có chữ Hán được chuyển thành `<ruby>字<rt class="py">zì</rt></ruby>`, dùng `rubyZh()` (gọi pinyin-pro, có cache).
- **Bỏ qua** những phần tử có `data-nopy`. Gắn thuộc tính này vào chỗ mà pinyin chính là đáp án: câu `p2h`, `tone`, `type`, màn gõ pinyin lúc bắt linh thú và lúc thăng hoa.
- Viết màn hình mới thì không cần tự thêm pinyin. Chỉ cần nhớ gắn `data-nopy` nếu đó là câu hỏi về pinyin.

---

## 6.11 Sao lưu tiến trình, PWA, cập nhật
- Nút **💾 Tiến trình** (`openSave`):
  - Tải file `.json`, hoặc chép mã có dạng `{app:'linh-thu-han-tu', v:1, at, save:S}`.
  - Khôi phục từ file hoặc từ mã dán vào. Trước khi khôi phục, bản hiện tại được cất ở khóa `lthn-v1-truoc-khoi-phuc`.
  - Đây là cách chuyển tiến trình giữa máy tính và điện thoại (localStorage gắn riêng với từng trình duyệt và từng địa chỉ web).
- **`sw.js`:**
  - Trang `index.html` lấy bản mới từ mạng trước, nên mỗi lần đẩy code lên là người chơi có bản mới.
  - Ảnh, thư viện CDN và font dùng bản đã lưu.
  - **Đổi ảnh hoặc danh sách `CORE` thì phải tăng `VERSION`** trong `sw.js`.
- **Triển khai:** GitHub Pages lấy từ nhánh `main` của kho `game/`. Quy trình cập nhật: sửa code → `git commit` → `git push`, khoảng 1 phút sau web có bản mới.
- Khung trình duyệt nhúng trong app Claude không chạy được service worker. Muốn thử PWA thì dùng Chrome hoặc điện thoại thật.

## 7. Tài nguyên và giấy phép
- Chỉ dùng tài nguyên **CC0**:
  - Kenney (Tiny Town, Tiny Dungeon, Tiny Creatures)
  - isaiah658 "50+ Monsters" (OpenGameArt)
- Phần ghi công đã có ở cuối trang.
- **Không dùng nhân vật, hình ảnh hay tên của Pokémon hoặc bất kỳ game có bản quyền nào**, kể cả khi chỉ dùng cá nhân. Linh thú phải là thiết kế riêng của game.
- Trong ảnh tilemap Tiny Creatures, thứ tự các con **không khớp** với thứ tự file trong thư mục `Tiles/`. Luôn cắt hình từ tilemap.

---

## 8. Quy ước khi sửa code
1. Giữ **một file** `index.html`, JS thuần, không framework, không bước build.
2. Mọi chữ hiển thị cho người chơi viết bằng **tiếng Việt**. Nội dung học là tiếng Trung.
3. Mọi chuỗi đưa vào HTML phải đi qua `esc()`.
4. Sửa xong thì **chạy thử trong trình duyệt** và xem console có lỗi không. Nhớ sao lưu rồi khôi phục `localStorage['lthn-v1']`.
5. Không làm hỏng tiến trình người chơi. Đổi dữ liệu thì viết migration.
6. Tôn trọng `prefers-reduced-motion`: đã có rule CSS tắt hiệu ứng động.
7. Chỉ tải thư viện ngoài từ CDN có ghi rõ phiên bản, ví dụ `pinyin-pro@3.26.0`.

---

## 9. Đã biết / chưa làm
- Chưa thử viết nét thật bằng chuột hay bút. Mới thử bằng mã giả lập và kiểm tra kích thước khung.
- Chưa thử trên điện thoại thật. Đã có nút điều hướng cảm ứng.
- pinyin-pro đôi khi đọc sai âm cuộn lưỡi, ví dụ 这儿 ra *zhè ér*, đúng phải là *zhèr*.
- Hô to cần trình duyệt Chrome và quyền dùng micro.

---

## 10. Hướng phát triển tiếp (người dùng đang quan tâm)

**Không cần AI:**
1. Nhiệm vụ đưa đồ: dân làng nhờ việc bằng tiếng Trung, ví dụ mua 苹果 hay tìm 雨伞.
2. Bảng truy nã hằng ngày, ví dụ "Bắt 1 linh thú hệ Thủy ở vùng 市场".
3. Hầm ngục chữ: mỗi tầng là một cánh cửa có khóa, phải ghép đúng từ mới qua. Tầng cuối có trùm.
4. Cốt truyện "Ấn Ngũ Hành": 5 trưởng hệ giữ 5 mảnh ấn, gom đủ thì mở vùng bí ẩn.
5. Câu cá chữ: nghe một từ rồi kéo đúng con cá.

**Có AI** (người dùng sẵn sàng gắn API AI):
1. Trò chuyện tự do với NPC. NPC chỉ dùng những từ đã học cộng vài từ mới, và sửa lỗi bằng tiếng Việt.
2. Mặc cả bằng câu tự gõ.
3. Nhiệm vụ tự sinh mỗi ngày, viết từ những từ đang đến hạn ôn.
4. Thám tử chữ Hán: hỏi chuyện các NPC để tìm manh mối.
5. Chấm câu nói của người chơi.

**Ghi chú khi gắn AI:**
- Game là trang tĩnh nên API key sẽ nằm trong trình duyệt (`localStorage`). Như vậy ổn khi chỉ một người dùng, **không được chia sẻ file có key**.
- Nên có một ô cài đặt để người dùng tự dán key.
- Gửi kèm ngữ cảnh: danh sách từ đã học (lấy từ `learned()` và `WORDS`), từ đến hạn (`dueWords()`), chủ đề vùng hiện tại.
- Yêu cầu AI trả về JSON có dạng `{zh, py, vi}` để đưa thẳng vào `dialog()`.
- Mọi kết quả AI trả về đều phải đi qua `esc()` trước khi hiển thị.

---

## 11. Bản sao lưu
- Các bản `index.before-*.html` (trước mỗi đợt sửa lớn) nằm trong thư mục tạm của phiên làm việc trước, có thể đã bị xoá.
- Nên dùng **git** cho thư mục này, hoặc tự copy `index.html` trước khi sửa lớn.
