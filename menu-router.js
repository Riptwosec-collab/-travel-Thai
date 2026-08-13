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
    saved:'ทริปของฉัน',
    analytics:'สถิติการรวม',
    notifications:'แจ้งเตือน',
    settings:'ตั้งค่า'
  };
  const menuMap = [
    ['หน้าหลัก','home'],['แผนที่','map'],['จังหวัด','provinces'],['สถานที่','places'],['กิจกรรม','activities'],['แรงบันดาลใจ','inspiration'],['แผนการเดินทาง','planner'],['บันทึกการเดินทาง','journal'],['ทริปของฉัน','trips'],['สถิติการรวม','analytics'],['สถิติกรรม','analytics'],['แจ้งเตือน','notifications'],['ตั้งค่า','settings']
  ];
  const style = document.createElement('style');
  style.id = 'working-menu-router-style';
  style.textContent = `
  .route-view{display:none;grid-column:2/-1;padding:10px 10px 12px 0;min-width:0;height:100%;overflow:auto;scrollbar-width:thin;scrollbar-color:rgba(233,196,111,.45) rgba(4,28,23,.55)}
  .main.route-mode{grid-template-columns:214px minmax(0,1fr)!important;gap:14px!important}.main.route-mode>.left,.main.route-mode>.map,.main.route-mode>.right{display:none!important}.main.route-mode>.route-view{display:block}.main.route-mode+.bottom,.bottom.route-hidden{display:none!important}
  .route-shell{min-height:100%;display:flex;flex-direction:column;gap:14px}.route-hero{border:1px solid rgba(235,192,100,.48);border-radius:20px;background:radial-gradient(circle at 78% 16%,rgba(255,215,125,.18),transparent 23%),linear-gradient(135deg,rgba(12,70,52,.92),rgba(3,24,20,.88));box-shadow:inset 0 0 30px rgba(255,220,140,.05),0 18px 46px rgba(0,0,0,.30);padding:22px 24px;display:grid;grid-template-columns:1.2fr .8fr;gap:18px;align-items:center;overflow:hidden}.route-kicker{display:inline-flex;width:max-content;padding:5px 11px;border-radius:999px;border:1px solid rgba(255,219,132,.38);color:#ffe3a0;background:rgba(4,32,25,.62);font-size:12px;font-weight:900}.route-hero h1{font-size:38px;line-height:1.05;margin:12px 0 8px;color:#ffe2a2;text-shadow:0 2px 22px rgba(0,0,0,.42)}.route-hero p{margin:0;color:#decda1;line-height:1.65;max-width:760px}.route-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.route-btn{height:40px;border-radius:999px;border:1px solid rgba(255,219,132,.38);padding:0 15px;background:rgba(5,34,27,.72);color:#ffdda0;font-weight:900}.route-btn.primary{background:linear-gradient(135deg,#1c7a5a,#0b4738);color:#ffe9b4}.route-btn.gold{background:linear-gradient(145deg,#fff0b0,#d69d3f);color:#09231b}.route-metric-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.route-metric{border:1px solid rgba(255,219,132,.26);border-radius:16px;background:rgba(4,25,20,.62);padding:15px;color:#cfc191}.route-metric b{display:block;color:#ffd98e;font-size:26px;line-height:1}.route-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.route-grid.cols-3{grid-template-columns:repeat(3,1fr)}.route-grid.cols-2{grid-template-columns:repeat(2,1fr)}.route-card{border:1px solid rgba(235,192,100,.42);border-radius:18px;background:linear-gradient(160deg,rgba(7,38,30,.88),rgba(5,28,23,.78));box-shadow:inset 0 0 24px rgba(255,218,128,.04),0 14px 34px rgba(0,0,0,.28);overflow:hidden;position:relative}.route-card.pad{padding:16px}.route-card h3{margin:0 0 10px;color:#efd184;font-size:18px}.route-card p,.route-card li{color:#d8c9a0;font-size:13px;line-height:1.6}.route-photo{height:118px;background:linear-gradient(160deg,rgba(255,202,96,.25),rgba(4,25,20,.75)),var(--photo);background-size:cover;background-position:center;border-bottom:1px solid rgba(255,219,132,.24)}.route-card .meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.route-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;border:1px solid rgba(255,219,132,.24);background:rgba(5,31,25,.56);color:#dec994;font-size:12px;font-weight:850;padding:5px 9px}.route-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;border:1px solid rgba(235,192,100,.36);border-radius:18px;background:rgba(5,34,27,.72);padding:12px;margin-bottom:14px}.route-input{height:40px;min-width:280px;border-radius:999px;border:1px solid rgba(255,219,132,.30);background:rgba(2,18,15,.66);color:#fff2c8;padding:0 14px;outline:none}.route-table{width:100%;border-collapse:separate;border-spacing:0 10px}.route-table th{text-align:left;color:#efd184;font-size:13px;padding:0 12px}.route-table td{background:rgba(5,34,27,.68);border-top:1px solid rgba(255,219,132,.18);border-bottom:1px solid rgba(255,219,132,.18);padding:12px;color:#e5d4a4;font-size:13px}.route-table td:first-child{border-left:1px solid rgba(255,219,132,.18);border-radius:12px 0 0 12px}.route-table td:last-child{border-right:1px solid rgba(255,219,132,.18);border-radius:0 12px 12px 0}.timeline{display:grid;gap:10px}.time-item{display:grid;grid-template-columns:92px 1fr 120px;gap:12px;align-items:center;border:1px solid rgba(255,219,132,.22);border-radius:16px;background:rgba(5,34,27,.62);padding:12px}.time{color:#ffd98e;font-weight:950}.status-done{color:#9fe19f}.status-wish{color:#ffd98e}.toggle-row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,219,132,.14);padding:12px 0}.route-switch{width:48px;height:24px;border-radius:99px;background:linear-gradient(90deg,#164734,#e9c46f);border:1px solid rgba(255,219,132,.42);position:relative}.route-switch:after{content:'';position:absolute;right:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#ffe5a1;box-shadow:0 0 10px rgba(255,210,98,.65)}
  @media(max-height:820px){.route-hero{padding:16px 18px}.route-hero h1{font-size:31px}.route-photo{height:92px}.route-card.pad{padding:13px}.route-grid{gap:10px}.time-item{padding:9px}.route-metric{padding:11px}.route-view{padding-top:8px}}
  @media(max-width:1300px){.route-grid{grid-template-columns:repeat(3,1fr)}.route-grid.cols-2,.route-grid.cols-3{grid-template-columns:repeat(2,1fr)}.route-hero{grid-template-columns:1fr}.route-metric-row{grid-template-columns:repeat(2,1fr)}}`;
  document.head.appendChild(style);

  function photo(seed){return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420"><rect width="720" height="420" fill="%23051c17"/><circle cx="${420+seed*18}" cy="90" r="70" fill="%23ffd37c" opacity=".55"/><path d="M0 340 C150 ${230+seed*10} 270 300 380 210 C500 110 610 190 720 120 L720 420 L0 420Z" fill="%23135c45"/><path d="M${320+seed*8} 370 L${390+seed*8} 370 L${374+seed*8} 255 L${400+seed*8} 255 L${354+seed*8} 130 L${305+seed*8} 255 L${330+seed*8} 255Z" fill="%23dca74b" opacity=".9"/></svg>')`}
  const provinces=['เชียงใหม่','เชียงราย','น่าน','กาญจนบุรี','กรุงเทพมหานคร','ภูเก็ต','กระบี่','สุราษฎร์ธานี'];
  const places=['วัดพระธาตุดอยสุเทพ','ดอยอินทนนท์','ประตูท่าแพ','บ้านแม่กำปอง','ทะเลหมอกอัยเยอร์เวง','เขื่อนเชี่ยวหลาน','เกาะพีพี','วัดอรุณ'];

  function hero(title,desc,buttons){
    return `<div class="route-hero"><div><span class="route-kicker">Luxury Thailand Travel Platform</span><h1>${title}</h1><p>${desc}</p><div class="route-actions">${(buttons||['สำรวจต่อ','บันทึก','แชร์']).map((b,i)=>`<button class="route-btn ${i==0?'primary':i==1?'gold':''}" onclick="toast('${b}')">${b}</button>`).join('')}</div></div><div class="route-metric-row"><div class="route-metric">จังหวัดที่ไปแล้ว<b>23</b></div><div class="route-metric">อยากไป<b>32</b></div><div class="route-metric">สถานที่<b>24,850</b></div><div class="route-metric">รีวิว<b>85,620</b></div></div></div>`;
  }
  function card(title,body){return `<div class="route-card pad"><h3>${title}</h3>${body}</div>`}
  function destinationCards(list){return `<div class="route-grid">${list.map((name,i)=>`<div class="route-card"><div class="route-photo" style="--photo:${photo(i)}"></div><div class="route-card pad"><h3>${name}</h3><p>${i%2?'เส้นทางยอดนิยม เหมาะกับทริป 2-3 วัน':'จุดหมายแนะนำ บรรยากาศดี ถ่ายรูปสวย'}</p><div class="meta"><span class="route-chip">★ ${(4.6+i/10).toFixed(1)}</span><span class="route-chip">${i%3?'อยากไป':'ไปแล้ว'}</span><span class="route-chip">ดูรายละเอียด</span></div></div></div>`).join('')}</div>`}

  const pages={
    home(){return `<div class="route-shell">${hero('หน้าหลักการเดินทาง','ศูนย์รวมภาพรวมการเที่ยวไทยของคุณ เห็นสถานะจังหวัด แผนทริปล่าสุด สถานที่ยอดนิยม และคำแนะนำตามฤดูกาลในหน้าเดียว',['สำรวจแผนที่','วางแผนทริป','ดูรายการโปรด'])}<div class="route-grid cols-3">${card('Quick Actions','<p>เริ่มจากแผนที่ เลือกจังหวัดที่เคยไป หรือสร้างทริปใหม่ได้ทันที</p><div class="meta"><span class="route-chip">สำรวจแผนที่</span><span class="route-chip">เพิ่มจังหวัด</span><span class="route-chip">ดูทริปล่าสุด</span></div>')}${card('จังหวัดแนะนำประจำฤดู','<p>เชียงใหม่ น่าน กาญจนบุรี และสุราษฎร์ธานี เป็นจังหวัดเด่นสำหรับช่วงนี้</p>')}${card('AI Summary','<p>คุณเที่ยวครบแล้ว 30% ของประเทศไทย เหลืออีก 54 จังหวัดเพื่อปลดล็อก Badge นักเดินทางครบทุกภาค</p>')}</div>${destinationCards(['เชียงใหม่','น่าน','กาญจนบุรี','สุราษฎร์ธานี'])}</div>`},
    provinces(){return `<div class="route-shell">${hero('จังหวัดทั้งหมด','ค้นหา กรอง และจัดการสถานะจังหวัดทั้ง 77 จังหวัด พร้อมเลือกหลายจังหวัดเพื่อสร้างทริป',['ค้นหาจังหวัด','กรองตามภาค','สร้างทริป'])}<div class="route-toolbar"><input class="route-input" placeholder="ค้นหาจังหวัด เช่น เชียงใหม่ ภูเก็ต น่าน"><div><button class="route-btn">ภาคเหนือ</button><button class="route-btn">ไปแล้ว</button><button class="route-btn">อยากไป</button></div></div>${destinationCards(provinces)}</div>`},
    places(){return `<div class="route-shell">${hero('สถานที่ท่องเที่ยว','ค้นหาสถานที่ท่องเที่ยวทั่วไทย แยกตามจังหวัด ประเภท คะแนน งบประมาณ และช่วงเวลาที่เหมาะสม',['ค้นหาสถานที่','เพิ่มในทริป','บันทึกสถานที่'])}<div class="route-toolbar"><input class="route-input" placeholder="ค้นหาวัด ภูเขา ทะเล คาเฟ่ ร้านอาหาร"><div><button class="route-btn">ธรรมชาติ</button><button class="route-btn">วัด</button><button class="route-btn">คาเฟ่</button></div></div>${destinationCards(places)}</div>`},
    activities(){return `<div class="route-shell">${hero('กิจกรรมและประสบการณ์','รวมกิจกรรมเดินป่า ดำน้ำ แคมป์ปิ้ง ไหว้พระ ชิมอาหาร Workshop และจุดถ่ายภาพทั่วประเทศ',['เลือกกิจกรรม','ดูตามจังหวัด','บันทึก'])}<div class="route-grid cols-3">${['เดินป่า','ไหว้พระ','ชิมอาหาร','คาเฟ่','ถ่ายภาพ','ดูดาว','ดำน้ำ','ชุมชนท้องถิ่น','Workshop'].map((x,i)=>card(x,`<p>กิจกรรมแนะนำในจังหวัดยอดนิยม ระยะเวลา ${i%3+1}-${i%3+2} ชั่วโมง</p><div class="meta"><span class="route-chip">★ ${(4.5+i/10).toFixed(1)}</span><span class="route-chip">${i%2?'ง่าย':'ปานกลาง'}</span></div>`)).join('')}</div></div>`},
    inspiration(){return `<div class="route-shell">${hero('แรงบันดาลใจ','บทความ เส้นทาง Road Trip Hidden Gems และไอเดียเที่ยวตามฤดูในโทน Editorial Travel',['อ่านบทความ','บันทึกไอเดีย','แชร์'])}${destinationCards(['เที่ยวเหนือหน้าหนาว','Road Trip กาญจนบุรี','Hidden Gems ภาคใต้','คาเฟ่ภูเขาเชียงใหม่','เที่ยวไทยงบประหยัด','สายถ่ายรูปต้องไป'])}</div>`},
    planner(){return `<div class="route-shell">${hero('แผนการเดินทาง','สร้างและแก้ไขตารางทริปแบบ Timeline พร้อมงบประมาณ เส้นทาง ที่พัก ร้านอาหาร และ Checklist',['บันทึกแผน','Export PDF','เพิ่มลงปฏิทิน'])}<div class="route-grid cols-2"><div class="route-card pad"><h3>ทริปเชียงใหม่ 3 วัน 2 คืน</h3><div class="timeline"><div class="time-item"><span class="time">09:00</span><div><b>วัดพระธาตุดอยสุเทพ</b><p>ไหว้พระ ชมวิวเมืองเชียงใหม่</p></div><span class="route-chip">วันที่ 1</span></div><div class="time-item"><span class="time">13:30</span><div><b>ประตูท่าแพ</b><p>ถ่ายรูป เดินเล่นเมืองเก่า</p></div><span class="route-chip">วันที่ 1</span></div><div class="time-item"><span class="time">08:00</span><div><b>ดอยอินทนนท์</b><p>ชมธรรมชาติและยอดดอย</p></div><span class="route-chip">วันที่ 2</span></div></div></div>${card('งบประมาณและ Checklist','<p>งบรวมประมาณ 8,500 บาท / 2 คน</p><ul><li>จองที่พัก</li><li>เช่ารถ</li><li>เตรียมเสื้อกันหนาว</li><li>บันทึกสถานที่สำรอง</li></ul>')}</div></div>`},
    journal(){return `<div class="route-shell">${hero('บันทึกการเดินทาง','เก็บความทรงจำ รูปภาพ ค่าใช้จ่าย อารมณ์ และโน้ตของแต่ละทริป',['เพิ่มบันทึก','อัปโหลดรูป','แชร์ Journal'])}<div class="route-grid cols-3">${['เชียงใหม่','กาญจนบุรี','ภูเก็ต','น่าน','กระบี่','กรุงเทพฯ'].map((x,i)=>card(`Journal: ${x}`,`<p>วันที่ ${12+i}/08/2569 · Mood ${i%2?'สงบ':'ประทับใจ'}</p><p>บันทึกความทรงจำและภาพถ่ายจากทริป</p><div class="meta"><span class="route-chip">${8+i} รูป</span><span class="route-chip">แก้ไข</span></div>`)).join('')}</div></div>`},
    trips(){return `<div class="route-shell">${hero('ทริปของฉัน','รวมทริปที่กำลังวางแผน กำลังเดินทาง เดินทางแล้ว และแบบร่างทั้งหมด',['สร้างทริปใหม่','ดูทริปถัดไป','แชร์ทริป'])}<table class="route-table"><thead><tr><th>ทริป</th><th>จังหวัด</th><th>วันที่</th><th>สถานะ</th><th>งบ</th></tr></thead><tbody>${[['เชียงใหม่ 3D2N','เชียงใหม่','20-22 ส.ค.','กำลังวางแผน','8,500'],['ทะเลใต้','ภูเก็ต กระบี่','ก.ย.','แบบร่าง','12,000'],['เมืองเก่าน่าน','น่าน','ธ.ค.','อยากไป','6,000'],['กาญจนบุรี Road Trip','กาญจนบุรี','เดินทางแล้ว','จบแล้ว','4,500']].map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`},
    analytics(){return `<div class="route-shell">${hero('สถิติการเดินทาง','วิเคราะห์จังหวัดที่ไปแล้ว ความคืบหน้า รายเดือน กิจกรรมยอดนิยม ค่าใช้จ่าย และ Achievement',['ดูรายเดือน','Export CSV','แชร์สถิติ'])}<div class="route-grid cols-3">${card('Progress ประเทศไทย','<p style="font-size:34px;color:#ffd98e;font-weight:950;margin:0">30%</p><p>23 จาก 77 จังหวัด</p>')}${card('ภูมิภาคที่เที่ยวมากสุด','<p>ภาคเหนือ 15 จังหวัด · ภาคอีสาน 18 จังหวัด · ภาคใต้ 7 จังหวัด</p>')}${card('กิจกรรมยอดนิยม','<p>ธรรมชาติ 68% · ไหว้พระ 57% · ชิมอาหาร 49% · คาเฟ่ 42%</p>')}${card('ค่าใช้จ่ายรวม','<p style="font-size:30px;color:#ffd98e;font-weight:950;margin:0">฿42,800</p><p>เฉลี่ยต่อทริป 5,350 บาท</p>')}${card('Travel Streak','<p>เดินทางต่อเนื่อง 4 เดือน · รีวิว 18 รายการ</p>')}${card('Achievements','<p>ปลดล็อก Badge นักเดินทางภาคเหนือ และ Food Explorer</p>')}</div></div>`},
    notifications(){return `<div class="route-shell">${hero('การแจ้งเตือน','รวมแจ้งเตือนทริป รีวิว สถานที่ รายการโปรด และระบบ',['อ่านทั้งหมด','ตั้งค่าแจ้งเตือน'])}<div class="route-grid cols-2">${['ทริปเชียงใหม่ใกล้ถึงวันเดินทาง','มีรีวิวใหม่ที่วัดพระธาตุดอยสุเทพ','สถานที่ที่บันทึกไว้มีคนแนะนำเพิ่ม','ระบบบันทึกสถานะจังหวัดสำเร็จ'].map((x,i)=>card(x,`<p>${i+1} ชั่วโมงที่ผ่านมา · หมวด ${i%2?'คอมมูนิตี้':'ทริป'}</p><div class="meta"><span class="route-chip">อ่านแล้ว</span><span class="route-chip">ลบ</span></div>`)).join('')}</div></div>`},
    settings(){return `<div class="route-shell">${hero('ตั้งค่า','จัดการบัญชี ธีม ภาษา การแจ้งเตือน ความเป็นส่วนตัว และข้อมูลการเดินทาง',['บันทึกการตั้งค่า','ดาวน์โหลดข้อมูล'])}<div class="route-grid cols-2">${card('บัญชีผู้ใช้','<div class="toggle-row"><span>โปรไฟล์สาธารณะ</span><span class="route-switch"></span></div><div class="toggle-row"><span>แสดงจังหวัดที่เคยไป</span><span class="route-switch"></span></div><div class="toggle-row"><span>สำรองข้อมูลอัตโนมัติ</span><span class="route-switch"></span></div>')}${card('ธีมและภาษา','<div class="toggle-row"><span>Dark Emerald Theme</span><span class="route-switch"></span></div><div class="toggle-row"><span>ภาษาไทย</span><span class="route-chip">TH</span></div><div class="toggle-row"><span>หน่วยระยะทาง</span><span class="route-chip">กิโลเมตร</span></div>')}${card('การแจ้งเตือน','<div class="toggle-row"><span>แจ้งเตือนทริป</span><span class="route-switch"></span></div><div class="toggle-row"><span>แจ้งเตือนสถานที่โปรด</span><span class="route-switch"></span></div>')}${card('ความเป็นส่วนตัว','<p>ควบคุมการแสดงผล Journal, Trip, Reviews และตำแหน่งล่าสุดของคุณ</p><button class="route-btn">เปิด Privacy Center</button>')}</div></div>`}
  };

  function ensureView(){
    const main=document.querySelector('.main');
    if(!main)return null;
    let view=document.querySelector('.route-view');
    if(!view){view=document.createElement('section');view.className='route-view';main.appendChild(view)}
    return view;
  }
  function routeFromButton(btn){
    const text=(btn.textContent||'').replace(/\s+/g,'').trim();
    const item=menuMap.find(([label])=>text.includes(label.replace(/\s+/g,'')));
    return item?item[1]:null;
  }
  function setActive(route){
    document.querySelectorAll('#side button,#nav button').forEach(btn=>{
      const r=btn.dataset.route;
      btn.classList.toggle('active',r===route || (route==='analytics' && r==='analytics'));
    });
  }
  function navigate(route, push=true){
    if(!pages[route] && route!=='map') route='map';
    const main=document.querySelector('.main');
    const view=ensureView();
    const bottom=document.querySelector('.bottom');
    if(!main||!view)return;
    if(route==='map'){
      main.classList.remove('route-mode');
      view.style.display='none';
      if(bottom)bottom.classList.remove('route-hidden');
    }else{
      main.classList.add('route-mode');
      view.style.display='block';
      view.innerHTML=pages[route]();
      if(bottom)bottom.classList.add('route-hidden');
    }
    setActive(route);
    document.title='เที่ยวไทย | '+(routeLabels[route]||'แผนที่');
    if(push) history.replaceState(null,'','#'+route);
    setTimeout(()=>window.dispatchEvent(new Event('resize')),60);
  }
  function bindButtons(){
    document.querySelectorAll('#side button,#nav button').forEach(btn=>{
      const route=routeFromButton(btn);
      if(!route)return;
      btn.dataset.route=route;
      btn.onclick=function(e){e.preventDefault();navigate(route);return false};
    });
    ensureView();
    const initial=(location.hash||'#map').replace('#','');
    navigate(initial,false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindButtons);else bindButtons();
  window.travelThaiNavigate=navigate;
})();