(function(){
  const routeLabels = {
    home:'หน้าหลัก',
    map:'แผนที่',
    provinces:'จังหวัด',
    places:'สถานที่',
    activities:'กิจกรรม',
    inspiration:'แรงบันดาลใจ',
    planner:'แผนการเดินทาง',
    journal:'บันทึกการเดินทาง',
    trips:'ทริปของฉัน',
    saved:'รายการโปรด',
    analytics:'สถิติการรวม',
    notifications:'แจ้งเตือน',
    settings:'ตั้งค่า'
  };

  const labelToRoute = [
    ['หน้าหลัก','home'],
    ['แผนที่','map'],
    ['จังหวัด','provinces'],
    ['สถานที่','places'],
    ['กิจกรรม','activities'],
    ['แรงบันดาลใจ','inspiration'],
    ['แผนการเดินทาง','planner'],
    ['บันทึกการเดินทาง','journal'],
    ['ทริปของฉัน','trips'],
    ['ทริปของฉัน','saved'],
    ['รายการโปรด','saved'],
    ['สถิติการรวม','analytics'],
    ['สถิติกรรม','analytics'],
    ['แจ้งเตือน','notifications'],
    ['ตั้งค่า','settings']
  ];

  const css = document.createElement('style');
  css.id = 'clean-premium-router-style';
  css.textContent = `
  :root{--calm-panel:rgba(5,30,24,.82);--calm-panel-2:rgba(7,42,33,.70);--calm-line:rgba(231,192,106,.30);--calm-line-strong:rgba(240,204,124,.46);--calm-gold:#e7c879;--calm-cream:#f5e6b7;--calm-muted:#b7c5a4;--calm-green:#7fc78b;--calm-coral:#d58c70;}
  body{letter-spacing:.01em!important}.top{box-shadow:0 12px 32px rgba(0,0,0,.28)!important;border-bottom-color:var(--calm-line)!important}.nav{gap:20px!important}.nav button{font-size:13px!important;color:#ddcd99!important}.nav button.active:before{background:rgba(255,224,144,.075)!important;border-color:rgba(255,224,144,.18)!important}.nav button.active:after{box-shadow:0 0 12px rgba(255,202,92,.55)!important}.search{box-shadow:inset 0 0 16px rgba(255,213,130,.035),0 0 10px rgba(228,176,78,.07)!important}.side{background:linear-gradient(180deg,rgba(4,29,23,.92),rgba(2,18,15,.78))!important}.side button{height:46px!important;margin:2px 0!important;color:#decf9d!important;font-size:13px!important;border-radius:0 18px 18px 0!important}.side button.active{background:linear-gradient(90deg,rgba(18,94,70,.90),rgba(8,52,41,.60))!important;box-shadow:0 0 16px rgba(240,190,78,.18),inset 0 0 16px rgba(255,220,130,.045)!important}.panel{border-color:var(--calm-line-strong)!important;box-shadow:inset 0 0 20px rgba(255,218,128,.025),0 10px 24px rgba(0,0,0,.22)!important;background:linear-gradient(160deg,rgba(7,36,30,.84),rgba(5,27,23,.75))!important}.body{padding:13px 14px!important}.title{font-size:15px!important}.stat{margin:7px 0!important;padding:8px!important;background:rgba(4,25,21,.56)!important}.stat-ico{width:42px!important;height:42px!important}.stat b{font-size:22px!important}.donut{width:108px!important;height:108px!important}.donut:after{inset:23px!important;font-size:14px!important}.legend,.act,.leg{font-size:12px!important}.hero{height:215px!important}.hero h1{font-size:38px!important}.hero p{font-size:13px!important}.quick .q{padding:8px 9px!important}.place{min-height:110px!important}.high{min-height:54px!important}.pills{gap:6px!important}.cta button{height:46px!important;font-size:21px!important}.share{height:36px!important}.bottom{opacity:.94!important}.toast{font-size:13px!important}

  .route-view{display:none;grid-column:2/-1;padding:14px 16px 18px 0;min-width:0;height:100%;overflow:auto;scrollbar-width:thin;scrollbar-color:rgba(233,196,111,.35) rgba(4,28,23,.45)}
  .main.route-mode{grid-template-columns:214px minmax(0,1fr)!important;gap:14px!important}.main.route-mode>.left,.main.route-mode>.map,.main.route-mode>.right{display:none!important}.main.route-mode>.route-view{display:block}.main.route-mode+.bottom,.bottom.route-hidden{display:none!important}
  .route-shell{min-height:100%;display:flex;flex-direction:column;gap:16px}.route-hero{border:1px solid var(--calm-line-strong);border-radius:22px;background:radial-gradient(circle at 84% 16%,rgba(255,215,125,.13),transparent 24%),linear-gradient(135deg,rgba(10,58,45,.92),rgba(3,23,20,.90));box-shadow:inset 0 0 24px rgba(255,220,140,.035),0 14px 36px rgba(0,0,0,.24);padding:22px 24px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(330px,.85fr);gap:22px;align-items:center;overflow:hidden}.route-kicker{display:inline-flex;width:max-content;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,219,132,.28);color:#f2d892;background:rgba(4,28,23,.58);font-size:12px;font-weight:850}.route-hero h1{font-size:34px;line-height:1.08;margin:12px 0 9px;color:#f6dfaa;text-shadow:none}.route-hero p{margin:0;color:#d8cca6;line-height:1.75;max-width:760px;font-size:14px}.route-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:17px}.route-btn{height:38px;border-radius:999px;border:1px solid rgba(255,219,132,.30);padding:0 15px;background:rgba(5,31,25,.62);color:#efd48f;font-weight:850}.route-btn.primary{background:linear-gradient(135deg,#1a7055,#0c4436);color:#fff0bf}.route-btn.gold{background:linear-gradient(145deg,#f3d98c,#d2a04d);color:#0b231b}.route-metric-row{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.route-metric{border:1px solid rgba(255,219,132,.22);border-radius:16px;background:rgba(4,25,21,.58);padding:14px;color:#c8bd92}.route-metric b{display:block;color:#efd184;font-size:24px;line-height:1.1;margin-top:4px}.route-toolbar{display:flex;gap:12px;align-items:center;justify-content:space-between;border:1px solid rgba(235,192,100,.30);border-radius:20px;background:rgba(5,31,25,.66);padding:12px 14px}.route-input{height:40px;min-width:290px;border-radius:999px;border:1px solid rgba(255,219,132,.24);background:rgba(2,18,15,.58);color:#fff2c8;padding:0 14px;outline:none}.route-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.route-grid.cols-3{grid-template-columns:repeat(3,1fr)}.route-grid.cols-2{grid-template-columns:repeat(2,1fr)}.route-card{border:1px solid rgba(235,192,100,.34);border-radius:20px;background:linear-gradient(160deg,rgba(7,36,30,.82),rgba(5,26,22,.72));box-shadow:inset 0 0 18px rgba(255,218,128,.025),0 10px 26px rgba(0,0,0,.22);overflow:hidden;position:relative}.route-card.pad{padding:17px}.route-card h3{margin:0 0 9px;color:#efd184;font-size:17px;line-height:1.35}.route-card p,.route-card li{color:#d4c79e;font-size:13px;line-height:1.7}.route-card ul{margin:8px 0 0;padding-left:18px}.route-photo{height:108px;background:linear-gradient(145deg,rgba(255,181,72,.18),rgba(4,25,20,.78)),var(--photo);background-size:cover;background-position:center;border-bottom:1px solid rgba(255,219,132,.20)}.meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.route-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;border:1px solid rgba(255,219,132,.20);background:rgba(5,31,25,.55);color:#dec994;font-size:12px;font-weight:750;padding:5px 9px}.route-section-title{display:flex;justify-content:space-between;align-items:center;color:#efd184;font-size:16px;font-weight:900;margin:3px 0 -2px}.route-table{width:100%;border-collapse:separate;border-spacing:0 9px}.route-table th{text-align:left;color:#efd184;font-size:12px;padding:0 12px;font-weight:850}.route-table td{background:rgba(5,31,25,.62);border-top:1px solid rgba(255,219,132,.15);border-bottom:1px solid rgba(255,219,132,.15);padding:12px;color:#dfd0a3;font-size:13px}.route-table td:first-child{border-left:1px solid rgba(255,219,132,.15);border-radius:13px 0 0 13px}.route-table td:last-child{border-right:1px solid rgba(255,219,132,.15);border-radius:0 13px 13px 0}.timeline{display:grid;gap:10px}.time-item{display:grid;grid-template-columns:86px 1fr 116px;gap:12px;align-items:center;border:1px solid rgba(255,219,132,.20);border-radius:17px;background:rgba(5,31,25,.58);padding:12px}.time{color:#efd184;font-weight:900}.status-done{color:#a8dfa2}.status-wish{color:#efd184}.toggle-row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,219,132,.12);padding:12px 0;color:#d8c9a0}.route-switch{width:48px;height:24px;border-radius:99px;background:linear-gradient(90deg,#164734,#dfbe68);border:1px solid rgba(255,219,132,.35);position:relative}.route-switch:after{content:'';position:absolute;right:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#ffe5a1;box-shadow:0 0 8px rgba(255,210,98,.45)}.empty-state{border:1px dashed rgba(255,219,132,.26);border-radius:18px;background:rgba(4,25,21,.42);padding:30px;text-align:center;color:#cbbf96}.page-note{border-left:3px solid rgba(231,192,106,.55);padding:10px 13px;background:rgba(255,216,132,.055);border-radius:0 14px 14px 0;color:#d6c59b;line-height:1.7}
  @media(max-height:820px){.route-hero{padding:17px 19px}.route-hero h1{font-size:29px}.route-photo{height:86px}.route-card.pad{padding:13px}.route-grid{gap:10px}.time-item{padding:9px}.route-metric{padding:11px}.route-view{padding-top:8px}.route-card h3{font-size:16px}}
  @media(max-width:1300px){.route-grid{grid-template-columns:repeat(3,1fr)}.route-grid.cols-2,.route-grid.cols-3{grid-template-columns:repeat(2,1fr)}.route-hero{grid-template-columns:1fr}.route-metric-row{grid-template-columns:repeat(4,1fr)}}`;
  document.head.appendChild(css);

  function safeToast(message){
    if(typeof window.toast === 'function') window.toast(message);
  }

  function photo(seed){
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420"><rect width="720" height="420" fill="%23051c17"/><circle cx="${420+seed*14}" cy="90" r="70" fill="%23ffd37c" opacity=".42"/><path d="M0 340 C150 ${236+seed*8} 270 300 380 218 C500 126 610 198 720 124 L720 420 L0 420Z" fill="%23135c45"/><path d="M${320+seed*8} 370 L${390+seed*8} 370 L${374+seed*8} 255 L${400+seed*8} 255 L${354+seed*8} 130 L${305+seed*8} 255 L${330+seed*8} 255Z" fill="%23dca74b" opacity=".82"/></svg>')`;
  }

  const provinceList = ['เชียงใหม่','น่าน','กาญจนบุรี','ภูเก็ต','กระบี่','สุราษฎร์ธานี','กรุงเทพมหานคร','เชียงราย'];
  const placeList = ['วัดพระธาตุดอยสุเทพ','ดอยอินทนนท์','ประตูท่าแพ','บ้านแม่กำปอง','เขื่อนเชี่ยวหลาน','เกาะพีพี','วัดอรุณ','น้ำตกเอราวัณ'];
  const activityList = ['เดินป่า','ไหว้พระ','ถ่ายรูปคาเฟ่','ชิมอาหาร','ดำน้ำ','แคมป์ปิ้ง','Road Trip','ชมชุมชน'];

  function hero(title, desc, buttons){
    return `<div class="route-hero">
      <div>
        <span class="route-kicker">เที่ยวไทย ครบทุกจังหวัด</span>
        <h1>${title}</h1>
        <p>${desc}</p>
        <div class="route-actions">${(buttons||['สำรวจต่อ','บันทึก','แชร์']).map((b,i)=>`<button class="route-btn ${i===0?'primary':i===1?'gold':''}" data-toast="${b}">${b}</button>`).join('')}</div>
      </div>
      <div class="route-metric-row">
        <div class="route-metric">ไปแล้ว<b>23 จังหวัด</b></div>
        <div class="route-metric">อยากไป<b>32 จังหวัด</b></div>
        <div class="route-metric">สถานที่<b>24,850</b></div>
        <div class="route-metric">รีวิว<b>85,620</b></div>
      </div>
    </div>`;
  }

  function card(title, body){
    return `<div class="route-card pad"><h3>${title}</h3>${body}</div>`;
  }

  function destinationCards(list, type){
    return `<div class="route-grid">${list.map((name,i)=>`
      <div class="route-card">
        <div class="route-photo" style="--photo:${photo(i)}"></div>
        <div class="route-card pad">
          <h3>${name}</h3>
          <p>${type==='activity'?'กิจกรรมแนะนำที่จัดเวลาและงบประมาณได้ง่าย':'ข้อมูลถูกจัดให้สั้น อ่านง่าย พร้อมสถานะและปุ่มใช้งานหลัก'}</p>
          <div class="meta">
            <span class="route-chip">★ ${(4.6+(i%4)/10).toFixed(1)}</span>
            <span class="route-chip">${i%3===0?'ไปแล้ว':'อยากไป'}</span>
            <span class="route-chip">ดูรายละเอียด</span>
          </div>
        </div>
      </div>`).join('')}</div>`;
  }

  function toolbar(placeholder, buttons){
    return `<div class="route-toolbar"><input class="route-input" placeholder="${placeholder}"><div>${buttons.map(b=>`<button class="route-btn" data-toast="${b}">${b}</button>`).join('')}</div></div>`;
  }

  const pages = {
    home(){
      return `<div class="route-shell">
        ${hero('หน้าหลักการเดินทาง','จัดภาพรวมการเที่ยวไทยให้ดูง่ายขึ้น เห็นสถานะจังหวัด แผนทริปล่าสุด และรายการสำคัญโดยไม่แน่นเกินไป',['สำรวจแผนที่','วางแผนทริป','ดูรายการโปรด'])}
        <div class="route-grid cols-3">
          ${card('วันนี้ควรทำอะไร','<p>เริ่มจากเลือกจังหวัดที่สนใจ ตรวจสถานที่แนะนำ แล้วกดเพิ่มลงแผนทริป</p><div class="meta"><span class="route-chip">สำรวจแผนที่</span><span class="route-chip">เพิ่มจังหวัด</span><span class="route-chip">บันทึกทริป</span></div>')}
          ${card('จังหวัดแนะนำ','<p>เชียงใหม่ น่าน กาญจนบุรี และสุราษฎร์ธานี เหมาะกับทริปธรรมชาติและวัฒนธรรม</p>')}
          ${card('สรุปความคืบหน้า','<p>คุณเที่ยวครบแล้ว 30% ของประเทศไทย เหลืออีก 54 จังหวัดเพื่อปลดล็อกเป้าหมายครบทุกภาค</p>')}
        </div>
        <div class="route-section-title"><span>ปลายทางแนะนำ</span><small>ดูทั้งหมด ›</small></div>
        ${destinationCards(['เชียงใหม่','น่าน','กาญจนบุรี','สุราษฎร์ธานี'])}
      </div>`;
    },
    provinces(){
      return `<div class="route-shell">
        ${hero('จังหวัดทั้งหมด','ค้นหา กรอง และจัดการสถานะจังหวัดทั้ง 77 จังหวัดได้จากหน้าเดียว พร้อมเลือกจังหวัดเพื่อสร้างทริป',['ค้นหาจังหวัด','กรองตามภาค','สร้างทริป'])}
        ${toolbar('ค้นหาจังหวัด เช่น เชียงใหม่ ภูเก็ต น่าน',['ภาคเหนือ','ไปแล้ว','อยากไป','ยังไม่ไป'])}
        ${destinationCards(provinceList)}
      </div>`;
    },
    places(){
      return `<div class="route-shell">
        ${hero('สถานที่ท่องเที่ยว','ค้นหาสถานที่เที่ยวทั่วไทยแบบเป็นระเบียบ แยกตามจังหวัด หมวดหมู่ คะแนน และสถานะบันทึก',['ค้นหาสถานที่','เพิ่มในทริป','ดูรายการโปรด'])}
        ${toolbar('ค้นหาสถานที่ เช่น วัด ภูเขา คาเฟ่ ทะเล',['ธรรมชาติ','วัฒนธรรม','คาเฟ่','ทะเล','เปิดอยู่'])}
        ${destinationCards(placeList)}
      </div>`;
    },
    activities(){
      return `<div class="route-shell">
        ${hero('กิจกรรมและประสบการณ์','รวมกิจกรรมที่เหมาะกับแต่ละจังหวัด เช่น เดินป่า ไหว้พระ ชิมอาหาร ดำน้ำ และถ่ายรูป',['เลือกกิจกรรม','จัดตามงบ','เพิ่มลงทริป'])}
        ${toolbar('ค้นหากิจกรรม เช่น เดินป่า ดำน้ำ Workshop',['ธรรมชาติ','วัฒนธรรม','อาหาร','ถ่ายรูป'])}
        ${destinationCards(activityList,'activity')}
      </div>`;
    },
    inspiration(){
      return `<div class="route-shell">
        ${hero('แรงบันดาลใจท่องเที่ยว','รวมบทความ เส้นทาง Road Trip และไอเดียเที่ยวตามฤดูกาลในรูปแบบอ่านง่าย',['อ่านบทความ','บันทึกไอเดีย','แชร์'])}
        <div class="route-grid cols-3">
          ${card('เที่ยวเหนือหน้าหนาว','<p>เส้นทางเชียงใหม่–น่าน–เชียงราย สำหรับคนชอบภูเขา หมอก และคาเฟ่</p>')}
          ${card('ทะเลใต้แบบพรีเมียม','<p>เลือกเกาะและที่พักที่เหมาะกับทริปพักผ่อน 3–5 วัน</p>')}
          ${card('Road Trip ใกล้กรุงเทพ','<p>กาญจนบุรี ราชบุรี และเขาใหญ่ เหมาะกับขับรถเที่ยวสุดสัปดาห์</p>')}
        </div>
      </div>`;
    },
    planner(){
      return `<div class="route-shell">
        ${hero('แผนการเดินทาง','สร้างทริปแบบเป็นวัน กำหนดเวลา สถานที่ ค่าใช้จ่าย และหมายเหตุได้เป็นระบบ',['สร้างทริปใหม่','Export PDF','เพิ่มลงปฏิทิน'])}
        <div class="route-card pad"><h3>แผนทริปเชียงใหม่ 3 วัน 2 คืน</h3><div class="timeline">
          <div class="time-item"><div class="time">09:00</div><div><b>วัดพระธาตุดอยสุเทพ</b><p>เริ่มทริปด้วยแลนด์มาร์กหลักของเชียงใหม่</p></div><div class="status-done">พร้อมเดินทาง</div></div>
          <div class="time-item"><div class="time">13:30</div><div><b>ประตูท่าแพ</b><p>เดินเล่น ถ่ายรูป และหาคาเฟ่ใกล้เมืองเก่า</p></div><div class="status-wish">อยากไป</div></div>
          <div class="time-item"><div class="time">17:30</div><div><b>ดอยสุเทพช่วงเย็น</b><p>ชมแสงเย็นและวิวเมืองเชียงใหม่</p></div><div class="status-done">แนะนำ</div></div>
        </div></div>
      </div>`;
    },
    journal(){
      return `<div class="route-shell">
        ${hero('บันทึกการเดินทาง','เก็บความทรงจำจากทริป รูปภาพ ค่าใช้จ่าย ความรู้สึก และโน้ตส่วนตัวไว้ในที่เดียว',['เพิ่มบันทึก','อัปโหลดรูป','แชร์'])}
        <div class="route-grid cols-3">
          ${card('เชียงใหม่ — 12 ส.ค.','<p>อากาศดีมาก คาเฟ่สวย และวิวภูเขาช่วงเย็นเหมาะกับถ่ายรูป</p><div class="meta"><span class="route-chip">12 รูป</span><span class="route-chip">Mood: Happy</span></div>')}
          ${card('กาญจนบุรี — 28 ก.ค.','<p>ขับรถง่าย วิวแม่น้ำสวย เหมาะกับทริป 2 วัน 1 คืน</p><div class="meta"><span class="route-chip">8 รูป</span><span class="route-chip">ธรรมชาติ</span></div>')}
          ${card('ภูเก็ต — Draft','<p>กำลังวางแผนรวมชายหาด จุดชมวิว และร้านอาหาร</p><div class="meta"><span class="route-chip">แบบร่าง</span></div>')}
        </div>
      </div>`;
    },
    trips(){
      return `<div class="route-shell">
        ${hero('ทริปของฉัน','จัดการทริปที่กำลังวางแผน กำลังเดินทาง เดินทางแล้ว และแบบร่างในหน้าเดียว',['เปิดทริปล่าสุด','สร้างทริป','Duplicate'])}
        <table class="route-table"><thead><tr><th>ทริป</th><th>ปลายทาง</th><th>วันที่</th><th>สถานะ</th><th>งบ</th></tr></thead><tbody>
          <tr><td>เชียงใหม่ 3 วัน</td><td>เชียงใหม่ / แม่กำปอง</td><td>22–24 ส.ค.</td><td>กำลังวางแผน</td><td>8,500 บาท</td></tr>
          <tr><td>ทะเลใต้</td><td>ภูเก็ต / กระบี่</td><td>ก.ย.</td><td>แบบร่าง</td><td>15,000 บาท</td></tr>
          <tr><td>ใกล้กรุงเทพ</td><td>กาญจนบุรี</td><td>เสาร์–อาทิตย์</td><td>พร้อมเดินทาง</td><td>4,200 บาท</td></tr>
        </tbody></table>
      </div>`;
    },
    saved(){
      return `<div class="route-shell">
        ${hero('รายการโปรด','รวมจังหวัด สถานที่ กิจกรรม และบทความที่บันทึกไว้ เพื่อกลับมาจัดทริปต่อได้ง่าย',['สร้าง Collection','เพิ่มลงทริป','แชร์ Collection'])}
        ${destinationCards(['เชียงใหม่','บ้านแม่กำปอง','ดอยอินทนนท์','คาเฟ่บนดอย'])}
      </div>`;
    },
    analytics(){
      return `<div class="route-shell">
        ${hero('สถิติการเดินทาง','ดูภาพรวมการเที่ยวไทยตามภาค เดือน กิจกรรม งบประมาณ และจังหวัดที่ไปบ่อย',['ดูรายเดือน','Export','ตั้งเป้าหมาย'])}
        <div class="route-grid cols-3">
          ${card('ความคืบหน้า','<p>ไปแล้ว 23 จาก 77 จังหวัด หรือ 30%</p><div class="bar"><i style="width:30%"></i></div>')}
          ${card('ภูมิภาคเด่น','<p>ภาคเหนือ 15 จังหวัด, ภาคอีสาน 18 จังหวัด, ภาคใต้ 7 จังหวัด</p>')}
          ${card('กิจกรรมยอดนิยม','<p>ธรรมชาติ 68%, ไหว้พระ 57%, ชิมอาหาร 49%, คาเฟ่ 42%</p>')}
        </div>
      </div>`;
    },
    notifications(){
      return `<div class="route-shell">
        ${hero('การแจ้งเตือน','รวมแจ้งเตือนทริป สถานที่ รีวิว และระบบ โดยจัดกลุ่มตามวันที่เพื่ออ่านง่าย',['อ่านทั้งหมด','ตั้งค่าแจ้งเตือน','ล้างรายการ'])}
        <div class="route-card pad"><h3>วันนี้</h3><div class="timeline">
          <div class="time-item"><div class="time">09:30</div><div><b>เชียงใหม่กำลังเป็นที่นิยม</b><p>มีสถานที่ใหม่ 4 แห่งถูกเพิ่มในจังหวัดเชียงใหม่</p></div><div>ใหม่</div></div>
          <div class="time-item"><div class="time">08:10</div><div><b>ทริปของคุณใกล้ถึงวันเดินทาง</b><p>ตรวจเช็ครายการก่อนเดินทางและงบประมาณ</p></div><div>ทริป</div></div>
        </div></div>
      </div>`;
    },
    settings(){
      return `<div class="route-shell">
        ${hero('ตั้งค่า','ปรับภาษา ธีม การแจ้งเตือน ความเป็นส่วนตัว และข้อมูลบัญชีให้เหมาะกับการใช้งาน',['บันทึกการตั้งค่า','รีเซ็ต','ช่วยเหลือ'])}
        <div class="route-grid cols-2">
          ${card('บัญชีผู้ใช้','<div class="toggle-row"><span>โปรไฟล์สาธารณะ</span><span class="route-switch"></span></div><div class="toggle-row"><span>ซิงก์ข้อมูลทริป</span><span class="route-switch"></span></div><div class="toggle-row"><span>สำรองข้อมูลอัตโนมัติ</span><span class="route-switch"></span></div>')}
          ${card('การแสดงผล','<div class="toggle-row"><span>Dark Emerald Theme</span><span class="route-switch"></span></div><div class="toggle-row"><span>ลดแสง Glow เพื่ออ่านง่าย</span><span class="route-switch"></span></div><div class="toggle-row"><span>โหมดสบายตา</span><span class="route-switch"></span></div>')}
        </div>
      </div>`;
    }
  };

  function ensureRouteView(){
    let view = document.getElementById('routeView');
    const main = document.querySelector('.main');
    if(!view && main){
      view = document.createElement('section');
      view.id = 'routeView';
      view.className = 'route-view';
      main.appendChild(view);
    }
    return view;
  }

  function setActive(route){
    document.querySelectorAll('.side button,.nav button').forEach(btn=>{
      const text = (btn.innerText || btn.textContent || '').trim();
      const matched = labelToRoute.find(([label])=>text.includes(label));
      btn.classList.toggle('active', !!matched && matched[1]===route);
    });
  }

  function renderRoute(route){
    const main = document.querySelector('.main');
    const bottom = document.querySelector('.bottom');
    const view = ensureRouteView();
    if(!main || !view) return;
    if(route === 'map'){
      main.classList.remove('route-mode');
      if(bottom) bottom.classList.remove('route-hidden');
      setActive('map');
      safeToast('เปิดหน้าแผนที่');
      return;
    }
    const render = pages[route] || pages.home;
    view.innerHTML = render();
    main.classList.add('route-mode');
    if(bottom) bottom.classList.add('route-hidden');
    setActive(route);
    view.querySelectorAll('[data-toast]').forEach(btn=>btn.addEventListener('click',()=>safeToast(btn.getAttribute('data-toast'))));
    safeToast('เปิดหน้า ' + (routeLabels[route] || 'หน้าหลัก'));
  }

  function wireMenus(){
    document.querySelectorAll('.side button,.nav button').forEach(btn=>{
      if(btn.dataset.routerReady === '1') return;
      btn.dataset.routerReady = '1';
      btn.addEventListener('click', ev=>{
        const text = (btn.innerText || btn.textContent || '').trim();
        const matched = labelToRoute.find(([label])=>text.includes(label));
        if(matched){
          ev.preventDefault();
          ev.stopImmediatePropagation();
          renderRoute(matched[1]);
        }
      }, true);
    });
  }

  ensureRouteView();
  wireMenus();
  setActive('map');
  window.travelThaiRoute = renderRoute;
  setTimeout(wireMenus, 300);
  setTimeout(wireMenus, 1000);
})();