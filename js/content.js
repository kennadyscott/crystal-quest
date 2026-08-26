/* Crystal Quest — world catalog + Grade 3 campaign content */
function $(s){ return document.querySelector(s); }
const LAND_KEYS = ['place','mult','dec','frac','geo','data'];

const LANDS = {
  place:{ title:'Place Value', center:[176,270],
    pill:[176,318], lockchip:null,
    unlocks:['mult','frac'], requires:null,
    flavor:'The Crystal Hills',
    buddy:'Every digit has a home!',
    art:{ src:'assets/lands/place.jpg?v=2', w:2200, h:1086 },
    spawn:[1168,970],
    worldGate:[215,400],
    gateAfter:3,
    pathsOpen:6,
    noSkip:true,
    nodes:[[744,672],[761,428],[868,208],[1344,248],[1344,598]],
    paths:[
      [[1168,1030],[1166,960],[1156,890],[1126,830],[1086,780],[1036,745],[996,720],[966,680],[956,640],[976,590],[986,540],[976,500]],
      [[996,720],[896,710],[806,695],[744,672]],
      [[744,672],[776,610],[796,540],[776,480],[761,428]],
      [[761,428],[836,460],[916,500],[976,500]],
      [[976,500],[956,400],[926,310],[896,250],[868,208]],
      [[976,500],[1026,420],[1061,350],[1086,295]],
      [[1086,295],[1196,265],[1276,255],[1344,248]],
      [[1036,745],[1126,730],[1226,680],[1296,640],[1344,598]],
      [[1344,598],[1354,480],[1351,350],[1344,248]]
    ],
    quests:[
      {name:'Place Value', icon:'🔢', short:'Place Value'},
      {name:'Represent Numbers', icon:'✍️', short:'Represent'},
      {name:'Compare and Order Whole Numbers', icon:'⚖️', short:'Compare & Order'},
      {name:'Rounding Numbers', icon:'🎯', short:'Rounding'},
      {name:'Counting Money', icon:'🪙', short:'Counting Money'}
    ]},
  mult:{ title:'Multiplication & Division', center:[549,300],
    pill:[549,345], lockchip:null,
    unlocks:['dec'], requires:'place',
    flavor:'Purple Peak',
    buddy:'Equal groups make magic!',
    path:[[510,470],[545,440],[560,390],[552,340],[548,300],[560,255]],
    nodes:[[510,470],[545,440],[560,390],[552,340],[548,300],[560,255]],
    quests:[
      {name:'Equal Groups', icon:'👥'},
      {name:'Arrays', icon:'⠿'},
      {name:'Facts Fluency', icon:'⚡'},
      {name:'Multiply by 10s', icon:'×10'},
      {name:'Division Basics', icon:'➗'},
      {name:'Word Problems', icon:'❓'}
    ]},
  dec:{ title:'Decimals', center:[875,300],
    pill:[918,305], lockchip:[875,253],
    unlocks:[], requires:'mult',
    flavor:'The Ice Spires',
    buddy:'The dot is a tiny doorway!',
    path:[[880,300],[900,275],[860,265],[850,250]],
    nodes:[[880,300],[890,288],[900,275],[880,270],[860,265],[850,250]],
    quests:[
      {name:'Tenths & Hundredths', icon:'🔢'},
      {name:'Compare Decimals', icon:'⚖️'},
      {name:'Round Decimals', icon:'🎯'},
      {name:'Add Decimals', icon:'➕'},
      {name:'Subtract Decimals', icon:'➖'},
      {name:'Decimal Boss', icon:'👑'}
    ]},
  frac:{ title:'Fractions', center:[184,590],
    pill:[184,617], lockchip:[184,547],
    unlocks:['geo'], requires:'place',
    flavor:'Sandy Cove',
    buddy:'Fair shares, happy dragons!',
    path:[[184,630],[155,600],[165,570],[190,600],[200,645]],
    nodes:[[184,630],[155,600],[165,570],[190,600],[200,645],[184,617]],
    quests:[
      {name:'Unit Fractions', icon:'🍕'},
      {name:'Comparing Fractions', icon:'⚖️'},
      {name:'Equivalent Fractions', icon:'🔁'},
      {name:'Number Line', icon:'📏'},
      {name:'Wholes as Fractions', icon:'⭕'},
      {name:'Fractions Boss', icon:'👑'}
    ]},
  geo:{ title:'Geometry', center:[487,650],
    pill:[487,698], lockchip:[488,628],
    unlocks:['data'], requires:'frac',
    flavor:'The Stone Ruins',
    buddy:'Shapes hide in the ruins!',
    path:[[490,705],[520,670],[500,640],[470,660]],
    nodes:[[490,705],[520,670],[500,640],[470,660],[487,698],[520,700]],
    quests:[
      {name:'Shapes', icon:'🔺'},
      {name:'Quadrilaterals', icon:'▭'},
      {name:'Partition Shapes', icon:'✂️'},
      {name:'Area', icon:'▦'},
      {name:'Perimeter', icon:'⬜'},
      {name:'Geometry Boss', icon:'👑'}
    ]},
  data:{ title:'Data', center:[853,580],
    pill:[853,626], lockchip:[852,553],
    unlocks:[], requires:'geo',
    flavor:'Whisperwood Keep',
    buddy:'Charts tell secret stories!',
    path:[[855,585],[860,545],[845,520]],
    nodes:[[855,585],[858,565],[860,545],[852,532],[845,520],[853,500]],
    quests:[
      {name:'Picture Graphs', icon:'🖼️'},
      {name:'Bar Graphs', icon:'📊'},
      {name:'Line Plots', icon:'📈'},
      {name:'Measure & Graph', icon:'📐'},
      {name:'Interpret Data', icon:'🔍'},
      {name:'Data Boss', icon:'👑'}
    ]}
};

function lessonHTML(title, body, extra, eq){
  return `<div class="qp-kicker">Lesson</div>
    <h3 class="qp-lt">${title}</h3>
    <p class="qp-lp">${body}</p>
    ${extra||''}
    ${eq?`<div class="qp-eq">${eq}</div>`:''}
    <button class="btn btn-primary" onclick="qpNext()">Got it — let's practice! ✏️</button>`;
}
function visGroups(parts){
  return `<div class="qp-groups">${parts.map(p=>`<div class="qp-group">${p}</div>`).join('')}</div>`;
}
function kws(list){
  return `<div class="qp-kws">${list.map(k=>`<span class="qp-kw">${k}</span>`).join('')}</div>`;
}
function smash(problems, time, intro){
  return {
    type:'smash',
    intro: intro || 'Crystals are floating up! Smash the one with the correct answer before time runs out. Combos earn bonus points!',
    time: time||45,
    problems
  };
}
function sortGame(bins, items, intro){
  return {
    type:'sort',
    intro: intro || 'Tap a crystal, then tap the bin it belongs in. Sort them all!',
    bins, items
  };
}

const QUEST_CONTENT = {

  /* ===================== PLACE VALUE ===================== */
  'Place Value': {
    land:'place',
    pre:[
      {q:'In 582, the 8 is in the ___ place.', a:['ones','tens','hundreds','thousands'], c:1},
      {q:'The 4 in 4,215 is worth…', a:['4','40','400','4,000'], c:3},
      {q:'Which digit is in the hundreds place of 7,306?', a:['7','3','0','6'], c:1}
    ],
    lesson: lessonHTML(
      'Every digit has a home',
      'A number is a team of digits. Each teammate stands in a place — ones, tens, hundreds, thousands — and that place gives it its value.',
      visGroups(['Thousands<br><b>4</b> → 4,000','Hundreds<br><b>2</b> → 200','Tens<br><b>1</b> → 10','Ones<br><b>5</b> → 5']),
      '4,215 = 4 thousands + 2 hundreds + 1 ten + 5 ones'
    ),
    practice:[
      {q:'The 6 in 365 is worth…', a:['6','60','600','16'], c:1, hint:'6 sits in the tens place → 6 tens → 60.'},
      {q:'In 9,040, which place is the 0 next to the 9?', a:['ones','tens','hundreds','thousands'], c:2, hint:'9 is thousands. The next house to the right is hundreds.'},
      {q:'What is the thousands digit in 8,152?', a:['8','1','5','2'], c:0, hint:'The first digit of a four-digit number is thousands.'}
    ],
    game: smash([
      {q:'Tens digit in 368', c:6, opts:[3,6,8,36]},
      {q:'The 5 in 5,102 is worth', c:5000, opts:[5,50,500,5000]},
      {q:'Hundreds place of 2,470', c:4, opts:[2,4,7,0]},
      {q:'9 tens + 4 ones', c:94, opts:[49,94,904,19]},
      {q:'Ones digit in 780', c:0, opts:[7,8,0,80]},
      {q:'The 1 in 1,999 is worth', c:1000, opts:[1,10,100,1000]}
    ], 45, 'Smash the crystal that matches the place or value!'),
    post:[
      {q:'In 704, which place is 0?', a:['ones','tens','hundreds','thousands'], c:1},
      {q:'The 2 in 2,860 is worth…', a:['2','20','200','2,000'], c:3},
      {q:'Hundreds digit of 3,519?', a:['3','5','1','9'], c:1}
    ]
  },

  'Represent Numbers': {
    land:'place',
    pre:[
      {q:'How do you write 305 in words?', a:['three hundred five','thirty-five','three hundred fifty','three thousand five'], c:0},
      {q:'326 in expanded form is…', a:['300+20+6','300+26','32+6','3+2+6'], c:0},
      {q:'What number is four hundred twenty?', a:['402','420','42','240'], c:1}
    ],
    lesson: lessonHTML(
      'Same number, three outfits',
      'Every number can dress three ways: standard form (420), word form (four hundred twenty), and expanded form (400 + 20). They are the same amount of crystal.',
      visGroups(['Standard<br><b>708</b>','Word<br><b>seven hundred eight</b>','Expanded<br><b>700 + 8</b>']),
      '708 = seven hundred eight = 700 + 8'
    ),
    practice:[
      {q:'Write 647 in words.', a:['six hundred forty-seven','six hundred fourteen-seven','sixty-four seven','six hundred seventy-four'], c:0, hint:'Say the hundreds, then the tens-and-ones: six hundred… forty-seven.'},
      {q:'Write 591 in expanded form.', a:['500+90+1','500+91','59+1','5+9+1'], c:0, hint:'5 hundreds + 9 tens + 1 one.'},
      {q:'Which is two hundred nine?', a:['29','290','209','902'], c:2, hint:'Two hundred + nine ones. A 0 holds the tens place.'}
    ],
    game: smash([
      {q:'seventy', c:70, opts:[17,70,700,7]},
      {q:'500+20+7', c:527, opts:[527,572,257,5207]},
      {q:'four hundred two', c:402, opts:[42,420,402,240]},
      {q:'Expanded 840', c:'800+40', opts:['800+40','80+40','800+4','8+4+0']},
      {q:'one hundred eleven', c:111, opts:[101,111,110,11]},
      {q:'300+9', c:309, opts:[39,309,390,3009]}
    ], 45, 'Match the form — smash the crystal that is the same number!'),
    post:[
      {q:'How do you write 540 in words?', a:['five hundred four','five hundred forty','fifty-four','five hundred fourteen'], c:1},
      {q:'418 in expanded form?', a:['400+18','400+10+8','40+18','4+1+8'], c:1},
      {q:'Which is 270 expanded?', a:['200+70','200+7','20+70','2+7+0'], c:0}
    ]
  },

  'Compare and Order Whole Numbers': {
    land:'place',
    pre:[
      {q:'Which is greater?', a:['312','321','231','213'], c:1},
      {q:'412 ○ 409', a:['>','<','=','+'], c:0},
      {q:'Order least to greatest: 85, 58, 805', a:['58, 85, 805','85, 58, 805','805, 85, 58','58, 805, 85'], c:0}
    ],
    lesson: lessonHTML(
      'Line them up and look LEFT',
      'To compare, start at the biggest place. The first digit that is different tells you who is greater. To order, compare that way over and over.',
      visGroups(['512<br>hundreds: <b>5</b>','498<br>hundreds: <b>4</b>']),
      '512 > 498 because 5 hundreds beat 4 hundreds'
    ),
    practice:[
      {q:'673 ○ 637', a:['>','<','=','×'], c:0, hint:'Hundreds match (6). Tens: 7 vs 3. 7 tens is more.'},
      {q:'Which is least?', a:['244','424','442','224'], c:3, hint:'Smallest hundreds first. 224 has only 2 hundreds.'},
      {q:'Least to greatest: 199, 201, 190', a:['190, 199, 201','199, 190, 201','201, 199, 190','190, 201, 199'], c:0, hint:'All have 1 hundred. Tens: 9, 0, 9 → 190 is smallest, then 199, then 201.'}
    ],
    game: sortGame(
      [{id:'gt', label:'500 or more', color:'#f0148f'}, {id:'lt', label:'Less than 500', color:'#5b21b6'}],
      [
        {text:'612', bin:'gt'},{text:'499', bin:'lt'},{text:'501', bin:'gt'},
        {text:'250', bin:'lt'},{text:'780', bin:'gt'},{text:'500', bin:'gt'},
        {text:'503', bin:'gt'},{text:'487', bin:'lt'}
      ],
      'Is each number 500 or more, or less than 500? Tap a crystal, then tap its bin!'
    ),
    post:[
      {q:'856 ○ 865', a:['>','<','=','+'], c:1},
      {q:'Which is greatest?', a:['707','770','077','700'], c:1},
      {q:'Least to greatest: 430, 403, 340', a:['340, 403, 430','403, 340, 430','430, 403, 340','340, 430, 403'], c:0}
    ]
  },

  'Rounding Numbers': {
    land:'place',
    pre:[
      {q:'Round 47 to the nearest ten.', a:['40','47','50','30'], c:2},
      {q:'Round 32 to the nearest ten.', a:['30','40','35','20'], c:0},
      {q:'Round 250 to the nearest hundred.', a:['200','300','250','100'], c:1}
    ],
    lesson: lessonHTML(
      '5 or more, climb the floor!',
      'Find the place you are rounding to. Peek at the digit one house to the RIGHT. If it is 5, 6, 7, 8, or 9 — round UP. If it is 0, 1, 2, 3, or 4 — stay down.',
      kws(['0–4 stay','5–9 climb']),
      '47 → ones is 7 → climb → <b>50</b> · 250 → tens is 5 → climb → <b>300</b>'
    ),
    practice:[
      {q:'Round 63 to the nearest ten.', a:['60','70','65','50'], c:0, hint:'Ones digit is 3 (less than 5) so stay at 60.'},
      {q:'Round 75 to the nearest ten.', a:['70','80','75','65'], c:1, hint:'5 on the door means climb: 75 → 80.'},
      {q:'Round 348 to the nearest hundred.', a:['300','350','400','340'], c:0, hint:'Look at the tens digit: 4. 4 is less than 5, so stay at 300.'}
    ],
    game: smash([
      {q:'Round 24 to ten', c:20, opts:[20,30,24,10]},
      {q:'Round 88 to ten', c:90, opts:[80,90,88,100]},
      {q:'Round 35 to ten', c:40, opts:[30,40,35,50]},
      {q:'Round 61 to ten', c:60, opts:[60,70,61,50]},
      {q:'Round 250 to hundred', c:300, opts:[200,300,250,100]},
      {q:'Round 812 to hundred', c:800, opts:[800,810,900,812]},
      {q:'Round 99 to ten', c:100, opts:[90,100,99,110]}
    ], 45, 'Round it, then smash that crystal!'),
    post:[
      {q:'Round 46 to the nearest ten.', a:['40','50','45','60'], c:1},
      {q:'Round 81 to the nearest ten.', a:['80','90','85','70'], c:0},
      {q:'Round 562 to the nearest hundred.', a:['500','560','600','550'], c:2}
    ]
  },

  'Counting Money': {
    land:'place',
    pre:[
      {q:'3 dimes are worth…', a:['3¢','12¢','30¢','300¢'], c:2},
      {q:'1 quarter + 1 nickel =', a:['20¢','25¢','30¢','35¢'], c:2},
      {q:'How many cents in $1?', a:['10','50','100','1,000'], c:2}
    ],
    lesson: lessonHTML(
      'Coins are place value in your pocket',
      'Pennies are ones. Dimes are tens. 10 dimes make 100 cents — one dollar. Count coins by skip-counting their values, then add.',
      visGroups(['Penny<br><b>1¢</b>','Nickel<br><b>5¢</b>','Dime<br><b>10¢</b>','Quarter<br><b>25¢</b>']),
      '2 quarters + 1 dime + 1 nickel = 25 + 25 + 10 + 5 = <b>65¢</b>'
    ),
    practice:[
      {q:'4 dimes and 2 pennies =', a:['6¢','42¢','24¢','402¢'], c:1, hint:'4 tens + 2 ones → 40¢ + 2¢ = 42¢.'},
      {q:'2 quarters and 1 dime =', a:['35¢','45¢','60¢','75¢'], c:2, hint:'25 + 25 + 10 = 60¢.'},
      {q:'Which is more money?', a:['3 dimes','1 quarter','they are equal','1 nickel'], c:0, hint:'3 dimes = 30¢. A quarter is 25¢. 30¢ is more.'}
    ],
    game: smash([
      {q:'5 nickels', c:'25¢', opts:['5¢','15¢','25¢','50¢']},
      {q:'1 quarter + 2 dimes', c:'45¢', opts:['35¢','45¢','47¢','70¢']},
      {q:'7 dimes', c:'70¢', opts:['7¢','17¢','70¢','700¢']},
      {q:'$1 in cents', c:'100¢', opts:['10¢','50¢','100¢','1¢']},
      {q:'3 quarters', c:'75¢', opts:['30¢','50¢','75¢','3¢']},
      {q:'1 dime + 4 pennies', c:'14¢', opts:['5¢','14¢','40¢','41¢']}
    ], 45, 'Count the coins, smash the matching amount!'),
    post:[
      {q:'6 dimes are worth…', a:['6¢','16¢','60¢','600¢'], c:2},
      {q:'1 quarter + 1 dime + 1 nickel =', a:['40¢','35¢','41¢','30¢'], c:0},
      {q:'Which equals $1?', a:['4 quarters','3 quarters','8 dimes','9 nickels'], c:0}
    ]
  },

  /* ===================== MULT / DIV ===================== */
  'Equal Groups': {
    land:'mult',
    pre:[
      {q:'3 groups of 4 is…', a:['7','12','34','9'], c:1},
      {q:'2 groups of 6 =', a:['8','12','26','4'], c:1},
      {q:'5 × 2 means…', a:['5+2','5 groups of 2','52','2 groups of 7'], c:1}
    ],
    lesson: lessonHTML(
      'Multiplication is EQUAL GROUPS',
      '3 × 4 asks: “3 groups, with 4 crystals in each group — how many crystals in all?”',
      visGroups(['💎💎💎💎','💎💎💎💎','💎💎💎💎']),
      '3 × 4 = <b>12</b>'
    ),
    practice:[
      {q:'4 groups of 5 =', a:['9','20','45','15'], c:1, hint:'4 × 5. Count 5, 10, 15, 20.'},
      {q:'6 × 3 means…', a:['6+3','6 groups of 3','63','3 groups of 9'], c:1, hint:'The first number is how many groups.'},
      {q:'2 groups of 9 =', a:['11','18','29','7'], c:1, hint:'Double 9.'}
    ],
    game: smash([
      {q:'3 groups of 5', c:15, opts:[8,15,35,10]},
      {q:'4 × 4', c:16, opts:[8,12,16,44]},
      {q:'2 groups of 8', c:16, opts:[10,16,18,6]},
      {q:'5 × 3', c:15, opts:[8,15,53,10]},
      {q:'6 groups of 2', c:12, opts:[8,12,62,4]},
      {q:'3 × 6', c:18, opts:[9,18,36,12]}
    ]),
    post:[
      {q:'5 groups of 4 =', a:['9','20','54','16'], c:1},
      {q:'7 × 2 =', a:['9','14','72','5'], c:1},
      {q:'3 groups of 8 =', a:['11','24','38','16'], c:1}
    ]
  },

  'Arrays': {
    land:'mult',
    pre:[
      {q:'An array with 3 rows of 5 is…', a:['8','15','35','2'], c:1},
      {q:'2 rows of 6 dots =', a:['8','12','26','4'], c:1},
      {q:'Rows × columns of 4 × 3 =', a:['7','12','43','1'], c:1}
    ],
    lesson: lessonHTML(
      'Arrays are neat rows',
      'An array is equal groups lined up in rows and columns. Count rows, count how many in a row, then multiply.',
      visGroups(['● ● ● ●','● ● ● ●','● ● ● ●']),
      '3 rows × 4 columns = <b>12</b>'
    ),
    practice:[
      {q:'5 rows of 3 =', a:['8','15','53','2'], c:1, hint:'5 × 3 = 15.'},
      {q:'A 4-by-4 window has how many panes?', a:['8','12','16','44'], c:2, hint:'4 rows of 4.'},
      {q:'2 rows of 7 =', a:['9','14','27','5'], c:1, hint:'Double 7.'}
    ],
    game: smash([
      {q:'3×5 array', c:15, opts:[8,15,35,10]},
      {q:'4×2 array', c:8, opts:[6,8,42,2]},
      {q:'6×3 array', c:18, opts:[9,18,63,12]},
      {q:'5×5 array', c:25, opts:[10,20,25,55]},
      {q:'2×9 array', c:18, opts:[11,18,29,7]},
      {q:'4×5 array', c:20, opts:[9,20,45,15]}
    ], 45, 'Each array is rows × columns. Smash the total!'),
    post:[
      {q:'3 rows of 6 =', a:['9','18','36','12'], c:1},
      {q:'A 2-by-10 egg carton holds…', a:['12','20','210','8'], c:1},
      {q:'7 × 3 array =', a:['10','21','73','4'], c:1}
    ]
  },

  'Facts Fluency': {
    land:'mult',
    pre:[
      {q:'6 × 6 =', a:['12','30','36','66'], c:2},
      {q:'8 × 5 =', a:['13','40','85','35'], c:1},
      {q:'7 × 4 =', a:['11','24','28','74'], c:2}
    ],
    lesson: lessonHTML(
      'Facts are skip-count magic',
      'You do not have to start from 1 every time. Skip-count, use a fact you know, or double a smaller fact.',
      kws(['5s are easy','doubles','×2 is double']),
      '7 × 4 = 7 × 2 × 2 = 14 × 2 = <b>28</b>'
    ),
    practice:[
      {q:'9 × 5 =', a:['14','40','45','95'], c:2, hint:'Skip-count fives: 5, 10, 15, 20, 25, 30, 35, 40, 45.'},
      {q:'8 × 8 =', a:['16','56','64','88'], c:2, hint:'8 × 8 is 64. Think 8 × 4 = 32, double it.'},
      {q:'3 × 9 =', a:['12','27','39','18'], c:1, hint:'3 × 10 = 30, minus one 3 is 27.'}
    ],
    game: smash([
      {q:'4 × 6', c:24, opts:[10,20,24,46]},
      {q:'7 × 5', c:35, opts:[12,30,35,75]},
      {q:'9 × 2', c:18, opts:[11,18,92,16]},
      {q:'6 × 8', c:48, opts:[14,42,48,68]},
      {q:'5 × 5', c:25, opts:[10,20,25,55]},
      {q:'3 × 7', c:21, opts:[10,21,37,24]},
      {q:'9 × 4', c:36, opts:[13,32,36,94]},
      {q:'8 × 3', c:24, opts:[11,21,24,83]}
    ], 40, 'Fact smash! Fast and fiery — combos pay extra.'),
    post:[
      {q:'8 × 7 =', a:['15','54','56','87'], c:2},
      {q:'9 × 6 =', a:['15','54','96','45'], c:1},
      {q:'4 × 9 =', a:['13','32','36','49'], c:2}
    ]
  },

  'Multiply by 10s': {
    land:'mult',
    pre:[
      {q:'4 × 10 =', a:['14','40','410','4'], c:1},
      {q:'7 × 10 =', a:['17','70','710','77'], c:1},
      {q:'10 × 10 =', a:['20','100','110','10'], c:1}
    ],
    lesson: lessonHTML(
      '×10 adds a ZERO',
      'Tens are packs of 10 crystals. Multiplying by 10 slides every digit one place to the left and tucks a 0 in the ones.',
      visGroups(['4','× 10','40']),
      '4 × 10 = <b>40</b> · 12 × 10 = <b>120</b>'
    ),
    practice:[
      {q:'8 × 10 =', a:['18','80','810','8'], c:1, hint:'Write 8, then a zero: 80.'},
      {q:'15 × 10 =', a:['25','150','1510','16'], c:1, hint:'15 with a zero on the end → 150.'},
      {q:'6 × 20 =', a:['26','80','120','62'], c:2, hint:'20 is 2 × 10, so 6 × 2 = 12, then ×10 = 120. Or 6 × 10 × 2.'}
    ],
    game: smash([
      {q:'3 × 10', c:30, opts:[13,30,310,3]},
      {q:'9 × 10', c:90, opts:[19,90,910,9]},
      {q:'11 × 10', c:110, opts:[21,101,110,111]},
      {q:'5 × 20', c:100, opts:[25,50,100,520]},
      {q:'4 × 30', c:120, opts:[34,70,120,430]},
      {q:'10 × 8', c:80, opts:[18,80,108,2]}
    ]),
    post:[
      {q:'12 × 10 =', a:['22','120','1210','102'], c:1},
      {q:'6 × 10 =', a:['16','60','610','4'], c:1},
      {q:'3 × 40 =', a:['12','70','120','340'], c:2}
    ]
  },

  'Division Basics': {
    land:'mult',
    pre:[
      {q:'12 ÷ 3 = ?', a:['3','4','6','2'], c:1},
      {q:'10 ÷ 2 = ?', a:['5','4','2','8'], c:0},
      {q:'8 ÷ 4 = ?',  a:['4','3','2','6'], c:2}
    ],
    lesson: lessonHTML(
      'Division means EQUAL GROUPS',
      '12 ÷ 3 asks: <b>"If I split 12 crystals into 3 equal groups, how many are in each group?"</b>',
      visGroups(['💎💎<br>💎💎','💎💎<br>💎💎','💎💎<br>💎💎']),
      '12 ÷ 3 = <b>4</b> in each group!'
    ),
    practice:[
      {q:'15 ÷ 3 = ?', a:['4','5','6','3'], c:1, hint:'Split 15 crystals into 3 equal groups. Count one group!'},
      {q:'14 ÷ 2 = ?', a:['6','8','7','12'], c:2, hint:'Half of 14 — share 14 between 2 friends.'},
      {q:'18 ÷ 6 = ?', a:['3','4','2','6'], c:0, hint:'How many 6s fit inside 18? Count: 6, 12, 18…'}
    ],
    game: smash([
      {q:'8 ÷ 2',  c:4, opts:[2,3,4,6]},
      {q:'15 ÷ 5', c:3, opts:[3,4,5,2]},
      {q:'16 ÷ 4', c:4, opts:[3,4,6,8]},
      {q:'18 ÷ 3', c:6, opts:[4,5,6,9]},
      {q:'20 ÷ 4', c:5, opts:[4,5,6,10]},
      {q:'12 ÷ 6', c:2, opts:[2,3,4,6]},
      {q:'21 ÷ 3', c:7, opts:[6,7,8,9]},
      {q:'24 ÷ 4', c:6, opts:[4,6,8,7]}
    ]),
    post:[
      {q:'16 ÷ 4 = ?', a:['3','4','5','6'], c:1},
      {q:'20 ÷ 4 = ?', a:['4','6','5','8'], c:2},
      {q:'12 ÷ 6 = ?', a:['2','3','4','6'], c:0}
    ]
  },

  'Word Problems': {
    land:'mult',
    pre:[
      {q:'12 cookies shared equally on 4 plates. How many on each plate?', a:['2','3','4','6'], c:1},
      {q:'10 pencils split between 2 boxes. How many per box?', a:['5','4','2','8'], c:0},
      {q:'Maya reads 3 pages a day. How many days to read 9 pages?', a:['2','4','3','6'], c:2}
    ],
    lesson: lessonHTML(
      'Spot the DIVISION words!',
      'Some words are secret signals that a story problem wants you to <b>divide</b>:',
      kws(['share equally','split into','each','groups of','per']) +
      `<p class="qp-lp">"18 stickers <b>shared equally</b> among 6 friends" → <b>18 ÷ 6 = 3</b> stickers each!</p>`,
      ''
    ),
    practice:[
      {q:'24 crayons split into 6 equal boxes. How many in each box?', a:['3','4','5','6'], c:1, hint:'"Split into" means divide: 24 ÷ 6.'},
      {q:'A dragon guards 20 gems in 5 equal piles. How many gems per pile?', a:['4','5','3','10'], c:0, hint:'"Per pile" means divide: 20 ÷ 5.'},
      {q:'16 students make teams of 4. How many teams?', a:['3','5','4','8'], c:2, hint:'"Teams of 4" — how many 4s in 16?'}
    ],
    game: smash([
      {q:'10 gems, 5 bags. Each bag?',    c:2, opts:[2,3,5,4]},
      {q:'12 eggs, 4 nests. Each nest?',  c:3, opts:[2,3,4,6]},
      {q:'18 stars, 9 wands. Each wand?', c:2, opts:[2,3,4,9]},
      {q:'14 fish, 2 tanks. Each tank?',  c:7, opts:[6,7,8,12]},
      {q:'25 coins, 5 chests. Each chest?', c:5, opts:[4,5,6,20]},
      {q:'16 wings, 8 dragons. Each dragon?', c:2, opts:[2,4,6,8]}
    ], 50, 'Story problems incoming! Smash the crystal with the right answer. Read fast, think faster!'),
    post:[
      {q:'21 apples shared equally in 3 baskets. How many per basket?', a:['6','7','8','9'], c:1},
      {q:'15 knights split into 5 equal squads. How many per squad?', a:['3','4','5','2'], c:0},
      {q:'Cupcakes come in boxes of 6. How many boxes for 18 cupcakes?', a:['2','4','3','6'], c:2}
    ]
  },

  /* ===================== DECIMALS ===================== */
  'Tenths & Hundredths': {
    land:'dec',
    pre:[
      {q:'0.3 means…', a:['3 ones','3 tenths','3 hundredths','30'], c:1},
      {q:'Which is 25 hundredths?', a:['25','2.5','0.25','0.025'], c:2},
      {q:'0.40 is the same as…', a:['4 tenths','40 tenths','4 hundredths','40'], c:0}
    ],
    lesson: lessonHTML(
      'The tiny places after the dot',
      'The first place after the decimal is <b>tenths</b> (slices of 10). The next is <b>hundredths</b> (slices of 100).',
      visGroups(['0.<b>4</b><br>4 tenths','0.4<b>5</b><br>5 hundredths']),
      '0.45 = 4 tenths + 5 hundredths'
    ),
    practice:[
      {q:'0.7 is how many tenths?', a:['7','70','0.07','1/7'], c:0, hint:'The first digit after the dot is tenths. 7 tenths.'},
      {q:'Which shows 8 hundredths?', a:['8','0.8','0.08','8.00'], c:2, hint:'Hundredths is the SECOND place: 0.08.'},
      {q:'0.50 = how many tenths?', a:['50','5','1/50','0.05'], c:1, hint:'50 hundredths is 5 tenths. 0.50 = 0.5.'}
    ],
    game: smash([
      {q:'6 tenths', c:'0.6', opts:['0.6','0.06','6','1.6']},
      {q:'3 hundredths', c:'0.03', opts:['0.3','0.03','3','0.33']},
      {q:'0.9 means', c:'9 tenths', opts:['9 tenths','9 hundredths','9 ones','90']},
      {q:'0.20 =', c:'2 tenths', opts:['20 tenths','2 tenths','2 hundredths','20']},
      {q:'45 hundredths', c:'0.45', opts:['0.45','4.5','0.045','45']},
      {q:'1 tenth', c:'0.1', opts:['0.1','0.01','1.0','0.001']}
    ]),
    post:[
      {q:'0.08 is…', a:['8 tenths','8 hundredths','8 ones','80'], c:1},
      {q:'Which is 4 tenths?', a:['0.04','0.4','4.0','0.004'], c:1},
      {q:'0.30 = 3 ___', a:['ones','tenths','hundredths','tens'], c:1}
    ]
  },

  'Compare Decimals': {
    land:'dec',
    pre:[
      {q:'0.4 ○ 0.38', a:['>','<','='], c:0},
      {q:'0.7 ○ 0.70', a:['>','<','='], c:2},
      {q:'Which is smallest?', a:['0.5','0.05','0.50','1.0'], c:1}
    ],
    lesson: lessonHTML(
      'Line up the DOTS',
      'Compare tenths first. Only if tenths are tied, look at hundredths. Extra zeros at the end do not change the value: 0.4 = 0.40.',
      visGroups(['0.40','0.38']),
      '0.40 > 0.38 because 4 tenths beat 3 tenths'
    ),
    practice:[
      {q:'0.6 ○ 0.60', a:['>','<','='], c:2, hint:'0.6 is 6 tenths = 60 hundredths = 0.60.'},
      {q:'0.25 ○ 0.3', a:['>','<','='], c:1, hint:'Tenths: 2 vs 3. 0.3 is bigger (think 0.30).'},
      {q:'Which is greatest?', a:['0.09','0.9','0.19','0.091'], c:1, hint:'0.9 is 9 tenths — the rest are still in the hundredths.'}
    ],
    game: sortGame(
      [{id:'big', label:'≥ 0.5', color:'#3fb7e8'}, {id:'sml', label:'< 0.5', color:'#5b21b6'}],
      [
        {text:'0.7', bin:'big'},{text:'0.4', bin:'sml'},{text:'0.50', bin:'big'},
        {text:'0.05', bin:'sml'},{text:'0.9', bin:'big'},{text:'0.49', bin:'sml'},
        {text:'0.51', bin:'big'},{text:'0.2', bin:'sml'}
      ]
    ),
    post:[
      {q:'0.8 ○ 0.75', a:['>','<','='], c:0},
      {q:'0.20 ○ 0.2', a:['>','<','='], c:2},
      {q:'Least: 0.6, 0.06, 0.66', a:['0.6','0.06','0.66'], c:1}
    ]
  },

  'Round Decimals': {
    land:'dec',
    pre:[
      {q:'Round 0.67 to the nearest tenth.', a:['0.6','0.7','0.67','1.0'], c:1},
      {q:'Round 0.32 to the nearest tenth.', a:['0.3','0.4','0.30','0'], c:0},
      {q:'Round 0.95 to the nearest tenth.', a:['0.9','1.0','0.95','0.10'], c:1}
    ],
    lesson: lessonHTML(
      'Same rounding song, smaller places',
      'Look at the digit to the RIGHT of the place you want. 5 or more → climb. 0–4 → stay. Rounding to tenths means peeking at hundredths.',
      kws(['peek right','5+ climb']),
      '0.67 → hundredths is 7 → climb → <b>0.7</b>'
    ),
    practice:[
      {q:'Round 0.41 to the nearest tenth.', a:['0.4','0.5','0.41','0'], c:0, hint:'Hundredths is 1 → stay at 0.4.'},
      {q:'Round 0.85 to the nearest tenth.', a:['0.8','0.9','0.85','1'], c:1, hint:'5 on the door → climb to 0.9.'},
      {q:'Round 1.26 to the nearest tenth.', a:['1.2','1.3','1.0','1.26'], c:1, hint:'Hundredths is 6 → climb 1.2 to 1.3.'}
    ],
    game: smash([
      {q:'Round 0.23', c:'0.2', opts:['0.2','0.3','0.23','0']},
      {q:'Round 0.58', c:'0.6', opts:['0.5','0.6','0.58','1']},
      {q:'Round 0.91', c:'0.9', opts:['0.9','1.0','0.91','0.8']},
      {q:'Round 0.45', c:'0.5', opts:['0.4','0.5','0.45','1']},
      {q:'Round 2.14', c:'2.1', opts:['2.1','2.2','2.0','2.14']},
      {q:'Round 0.99', c:'1.0', opts:['0.9','1.0','0.99','0.10']}
    ], 45, 'Round each decimal to the nearest TENTH!'),
    post:[
      {q:'Round 0.74 to the nearest tenth.', a:['0.7','0.8','0.74','1'], c:1},
      {q:'Round 0.05 to the nearest tenth.', a:['0','0.1','0.05','0.5'], c:1},
      {q:'Round 3.5 to the nearest one.', a:['3','4','3.5','5'], c:1}
    ]
  },

  'Add Decimals': {
    land:'dec',
    pre:[
      {q:'0.3 + 0.2 =', a:['0.5','0.05','5','0.23'], c:0},
      {q:'0.25 + 0.10 =', a:['0.35','0.26','2.5','0.7'], c:0},
      {q:'1.4 + 0.4 =', a:['1.8','1.44','0.18','2'], c:0}
    ],
    lesson: lessonHTML(
      'Line up the decimal points',
      'Write the numbers so the dots sit in a column. Then add each place, just like whole numbers. Tenths add with tenths.',
      visGroups(['0.45','+ 0.30','0.75']),
      '0.45 + 0.30 = <b>0.75</b>'
    ),
    practice:[
      {q:'0.6 + 0.15 =', a:['0.75','0.21','0.615','7.5'], c:0, hint:'0.60 + 0.15 = 0.75. Add a zero so places line up.'},
      {q:'0.08 + 0.07 =', a:['0.15','0.015','0.87','1.5'], c:0, hint:'8 hundredths + 7 hundredths = 15 hundredths = 0.15.'},
      {q:'2.3 + 1.2 =', a:['3.5','3.2','2.5','4'], c:0, hint:'Ones: 2+1=3. Tenths: 3+2=5. → 3.5'}
    ],
    game: smash([
      {q:'0.4 + 0.4', c:'0.8', opts:['0.8','0.08','0.44','8']},
      {q:'0.2 + 0.05', c:'0.25', opts:['0.25','0.7','0.025','2.05']},
      {q:'0.50 + 0.25', c:'0.75', opts:['0.75','0.55','2.5','0.70']},
      {q:'1.1 + 1.1', c:'2.2', opts:['2.2','1.2','11.1','2.11']},
      {q:'0.09 + 0.01', c:'0.10', opts:['0.10','0.010','0.9','0.08']},
      {q:'0.7 + 0.2', c:'0.9', opts:['0.9','0.09','0.5','7.2']}
    ]),
    post:[
      {q:'0.35 + 0.45 =', a:['0.70','0.80','0.710','8'], c:1},
      {q:'0.5 + 0.5 =', a:['0.10','1.0','0.55','5'], c:1},
      {q:'1.25 + 0.25 =', a:['1.50','1.40','1.2525','2.5'], c:0}
    ]
  },

  'Subtract Decimals': {
    land:'dec',
    pre:[
      {q:'0.8 − 0.3 =', a:['0.5','0.11','5','0.05'], c:0},
      {q:'0.60 − 0.20 =', a:['0.40','0.40?','0.4','0.08'], c:2},
      {q:'1.5 − 0.4 =', a:['1.1','1.9','0.11','1.54'], c:0}
    ],
    lesson: lessonHTML(
      'Keep the dots in a column',
      'Subtract the same way you add: line up decimal points, then subtract each place. Borrow from the next place if you need to.',
      visGroups(['0.80','− 0.35','0.45']),
      '0.80 − 0.35 = <b>0.45</b>'
    ),
    practice:[
      {q:'0.9 − 0.4 =', a:['0.5','0.13','5','0.05'], c:0, hint:'9 tenths minus 4 tenths = 5 tenths.'},
      {q:'0.50 − 0.25 =', a:['0.25','0.35','0.75','2.5'], c:0, hint:'50 hundredths − 25 hundredths = 25 hundredths.'},
      {q:'1.00 − 0.40 =', a:['0.60','1.40','0.60?','0.06'], c:0, hint:'One whole minus 4 tenths leaves 6 tenths: 0.60.'}
    ],
    game: smash([
      {q:'0.7 − 0.2', c:'0.5', opts:['0.5','0.9','0.05','5']},
      {q:'0.40 − 0.10', c:'0.30', opts:['0.30','0.50','0.3','0.03']},
      {q:'0.8 − 0.05', c:'0.75', opts:['0.75','0.85','0.03','8.05']},
      {q:'1.2 − 0.2', c:'1.0', opts:['1.0','1.4','0.10','1.22']},
      {q:'0.55 − 0.05', c:'0.50', opts:['0.50','0.60','0.5','0.05']},
      {q:'0.9 − 0.9', c:'0.0', opts:['0.0','1.8','0.09','9']}
    ]),
    post:[
      {q:'0.6 − 0.15 =', a:['0.45','0.55','0.75','4.5'], c:0},
      {q:'1.4 − 0.7 =', a:['0.7','1.3','0.07','2.1'], c:0},
      {q:'0.32 − 0.12 =', a:['0.20','0.44','0.2','0.021']}
    ]
  },

  'Decimal Boss': {
    land:'dec',
    pre:[
      {q:'0.4 + 0.35 =', a:['0.39','0.75','0.075','4.35'], c:1},
      {q:'0.8 ○ 0.75', a:['>','<','='], c:0},
      {q:'Round 0.46 to tenths.', a:['0.4','0.5','0.46','1'], c:1}
    ],
    lesson: lessonHTML(
      'The Ice Crystal Trial',
      'Tenths, hundredths, compare, round, add, subtract — the ice crystal wants all of it. Line up those dots.',
      kws(['tenths','hundredths','line up dots']),
      '0.40 = 0.4 · 0.67 → 0.7 · 0.5 + 0.25 = 0.75'
    ),
    practice:[
      {q:'Which is 7 hundredths?', a:['0.7','0.07','7','0.007'], c:1, hint:'Second place after the dot.'},
      {q:'0.90 − 0.25 =', a:['0.65','1.15','0.75','0.115'], c:0, hint:'90 − 25 hundredths = 65 hundredths.'},
      {q:'Greatest: 0.8, 0.08, 0.88', a:['0.8','0.08','0.88'], c:2, hint:'0.88 has 8 tenths AND 8 hundredths.'}
    ],
    game: smash([
      {q:'5 tenths', c:'0.5', opts:['0.5','0.05','5','0.005']},
      {q:'0.2 + 0.2', c:'0.4', opts:['0.4','0.04','0.22','4']},
      {q:'Round 0.81', c:'0.8', opts:['0.8','0.9','0.81','1']},
      {q:'0.6 − 0.2', c:'0.4', opts:['0.4','0.8','0.4?','0.04']},
      {q:'0.70 ○ 0.7  →', c:'=', opts:['>','<','=']},
      {q:'0.09 + 0.11', c:'0.20', opts:['0.20','0.20?','0.2','1.01']}
    ], 50, 'BOSS SMASH — ice crystals, mixed decimal skills!'),
    post:[
      {q:'0.45 + 0.15 =', a:['0.60','0.30','0.051','6'], c:0},
      {q:'0.3 ○ 0.30', a:['>','<','='], c:2},
      {q:'Round 1.95 to tenths.', a:['1.9','2.0','1.95','1.0'], c:1}
    ]
  },

  /* ===================== FRACTIONS ===================== */
  'Unit Fractions': {
    land:'frac',
    pre:[
      {q:'1/4 means…', a:['4 pieces, any size','1 of 4 equal parts','1 leftover','4 of 1'], c:1},
      {q:'Which is a unit fraction?', a:['3/4','1/6','2/2','4/3'], c:1},
      {q:'A pizza in 8 equal slices. One slice is…', a:['1/8','8/1','1/2','8/8'], c:0}
    ],
    lesson: lessonHTML(
      'A unit fraction is ONE piece',
      'The bottom number (denominator) tells how many equal parts the whole was cut into. The top is 1 — you took one of those parts.',
      visGroups(['⬤ quartered','1 shaded','1/4']),
      '<b>1/4</b> = one of four equal parts'
    ),
    practice:[
      {q:'1/3 of a sandwich is…', a:['1 of 3 equal parts','3 sandwiches','the biggest piece','3 bites'], c:0, hint:'Denominator 3 = three equal parts. Numerator 1 = one of them.'},
      {q:'Which unit fraction is smaller?', a:['1/2','1/8','they are equal','1'], c:1, hint:'More equal parts means each part is tinier. 1/8 is a smaller bite than 1/2.'},
      {q:'A chocolate bar in 6 equal squares. One square?', a:['1/6','6/1','1/2','6/6'], c:0, hint:'One of six equal parts → 1/6.'}
    ],
    game: smash([
      {q:'1 of 2 equal parts', c:'1/2', opts:['1/2','2/1','1/4','2/2']},
      {q:'1 of 5 equal parts', c:'1/5', opts:['1/5','5/1','1/2','5/5']},
      {q:'Unit fraction?', c:'1/8', opts:['3/8','1/8','8/3','2/2']},
      {q:'1 of 10 parts', c:'1/10', opts:['1/10','10/1','1/2','0.1/10']},
      {q:'Bigger bite: 1/3 or 1/6?', c:'1/3', opts:['1/3','1/6','same','0']},
      {q:'Whole pizza, 4 slices, eat 1', c:'1/4', opts:['1/4','4/1','1/2','3/4']}
    ]),
    post:[
      {q:'1/10 means…', a:['10 equal parts, take 1','1 equal part, take 10','ten wholes','half'], c:0},
      {q:'Which is a unit fraction?', a:['2/5','1/12','3/3','5/4'], c:1},
      {q:'Which is larger?', a:['1/2','1/5','1/8','1/100'], c:0}
    ]
  },

  'Comparing Fractions': {
    land:'frac',
    pre:[
      {q:'Which is greater: 2/5 or 4/5?', a:['2/5','4/5','equal','cannot tell'], c:1},
      {q:'Which is greater: 1/3 or 1/6?', a:['1/3','1/6','equal','0'], c:0},
      {q:'3/8 ○ 5/8', a:['>','<','='], c:1}
    ],
    lesson: lessonHTML(
      'Same bottom? Peek at the top. Same top? Bigger bottom is smaller!',
      'If denominators match, the bigger numerator wins — more pieces of the same size. If numerators match (unit-style), the bigger denominator means tinier pieces.',
      kws(['same denominator → compare tops','same numerator → bigger bottom is smaller']),
      '4/5 > 2/5 &nbsp;·&nbsp; 1/3 > 1/8'
    ),
    practice:[
      {q:'5/6 ○ 3/6', a:['>','<','='], c:0, hint:'Same size pieces (sixths). 5 pieces beat 3 pieces.'},
      {q:'1/4 ○ 1/2', a:['>','<','='], c:1, hint:'Same numerator. Fourths are smaller slices than halves.'},
      {q:'Which is least?', a:['3/8','7/8','1/8','8/8'], c:2, hint:'All eighths. Smallest top is 1/8.'}
    ],
    game: sortGame(
      [{id:'big', label:'Greater than 1/2', color:'#f0148f'}, {id:'sml', label:'Less than 1/2', color:'#5b21b6'}],
      [
        {text:'3/4', bin:'big'},{text:'1/4', bin:'sml'},{text:'2/3', bin:'big'},
        {text:'1/3', bin:'sml'},{text:'5/6', bin:'big'},{text:'1/8', bin:'sml'},
        {text:'5/8', bin:'big'},{text:'2/6', bin:'sml'}
      ],
      'Is each fraction more or less than half a crystal? Tap, then bin!'
    ),
    post:[
      {q:'6/8 ○ 2/8', a:['>','<','='], c:0},
      {q:'1/5 ○ 1/9', a:['>','<','='], c:0},
      {q:'Greatest: 2/6, 5/6, 1/6', a:['2/6','5/6','1/6'], c:1}
    ]
  },

  'Equivalent Fractions': {
    land:'frac',
    pre:[
      {q:'1/2 = ?', a:['1/3','2/4','2/2','3/5'], c:1},
      {q:'2/4 ○ 1/2', a:['>','<','='], c:2},
      {q:'Which equals 1/3?', a:['2/6','1/6','3/3','2/3'], c:0}
    ],
    lesson: lessonHTML(
      'Same amount, different slices',
      'If you cut a chocolate bar into more pieces but eat the same amount of bar, the fractions look different but mean the same. Multiply (or divide) top AND bottom by the same number.',
      visGroups(['1/2','=','2/4','=','4/8']),
      '1/2 = 2/4 = 4/8'
    ),
    practice:[
      {q:'3/6 = ?', a:['1/3','1/2','3/3','6/3'], c:1, hint:'Divide top and bottom by 3: 3/6 = 1/2.'},
      {q:'Which equals 2/3?', a:['2/6','4/6','3/2','2/5'], c:1, hint:'Multiply top and bottom by 2: 2/3 = 4/6.'},
      {q:'5/10 is the same as…', a:['1/5','1/2','5/5','10/5'], c:1, hint:'Divide by 5: 1/2.'}
    ],
    game: smash([
      {q:'1/2 = ?', c:'2/4', opts:['1/4','2/4','2/2','3/4']},
      {q:'1/3 = ?', c:'2/6', opts:['1/6','2/6','3/3','2/3']},
      {q:'2/8 = ?', c:'1/4', opts:['1/2','1/4','2/4','8/2']},
      {q:'3/3 = ?', c:'1', opts:['0','1','3','1/3']},
      {q:'4/8 = ?', c:'1/2', opts:['1/4','1/2','4/4','8/4']},
      {q:'2/5 = ?', c:'4/10', opts:['2/10','4/10','5/2','1/5']}
    ]),
    post:[
      {q:'6/8 = ?', a:['3/4','6/4','2/8','1/8'], c:0},
      {q:'Which equals 1/4?', a:['2/4','2/8','1/2','4/1'], c:1},
      {q:'4/6 ○ 2/3', a:['>','<','='], c:2}
    ]
  },

  'Number Line': {
    land:'frac',
    pre:[
      {q:'On a 0-to-1 line split into 4ths, the first mark is…', a:['1/4','1/2','4','0.4'], c:0},
      {q:'Where does 1/2 sit between 0 and 1?', a:['near 0','the middle','near 1','off the line'], c:1},
      {q:'3/4 is closer to…', a:['0','1','2','−1'], c:1}
    ],
    lesson: lessonHTML(
      'Fractions live on a line',
      'From 0 (nothing) to 1 (the whole), equal tick marks show equal parts. 2/4 and 1/2 land on the SAME tick.',
      visGroups(['0','1/4','1/2','3/4','1']),
      'Count the hops from 0. Two hops of 1/4 land on <b>1/2</b>.'
    ),
    practice:[
      {q:'A line in thirds. The second tick is…', a:['1/3','2/3','3/3','1/2'], c:1, hint:'First tick 1/3, second tick 2/3, third tick 3/3=1.'},
      {q:'Which is closest to 0?', a:['1/8','1/2','3/4','1'], c:0, hint:'Tiny unit fractions sit near 0.'},
      {q:'4/4 sits at…', a:['0','1/2','1','4'], c:2, hint:'4 of 4 parts is the whole = 1.'}
    ],
    game: smash([
      {q:'Middle of 0–1', c:'1/2', opts:['1/4','1/2','3/4','0']},
      {q:'3 hops of 1/4', c:'3/4', opts:['1/4','1/2','3/4','1']},
      {q:'0 hops', c:'0', opts:['0','1','1/2','1/8']},
      {q:'Line in 5ths, 1st tick', c:'1/5', opts:['1/5','2/5','1/2','5']},
      {q:'Same tick as 2/4', c:'1/2', opts:['1/4','1/2','2/2','0']},
      {q:'Just before 1 (fourths)', c:'3/4', opts:['1/4','1/2','3/4','4/4']}
    ]),
    post:[
      {q:'On eighths, 4/8 is at…', a:['1/8','1/2','1','8'], c:1},
      {q:'Which is farthest right on 0–1?', a:['1/6','1/3','1/2','5/6'], c:3},
      {q:'2/2 is at…', a:['0','1/2','1','2'], c:2}
    ]
  },

  'Wholes as Fractions': {
    land:'frac',
    pre:[
      {q:'4/4 =', a:['0','1','4','1/4'], c:1},
      {q:'8/4 =', a:['1','2','4','8'], c:1},
      {q:'Which equals 1?', a:['3/4','5/5','1/5','5/1'], c:1}
    ],
    lesson: lessonHTML(
      'When the pieces rebuild the whole',
      'If the top and bottom match, you have one whole. If the top is bigger, you have more than one whole. 8/4 means “8 fourths” — that is 2 wholes.',
      visGroups(['4/4 = 1','8/4 = 2','2/2 = 1']),
      'a/a = <b>1</b> &nbsp;·&nbsp; 8/4 = <b>2</b>'
    ),
    practice:[
      {q:'6/6 =', a:['0','1','6','1/6'], c:1, hint:'Top equals bottom → one whole.'},
      {q:'9/3 =', a:['3','6','9','1'], c:0, hint:'How many 3s in 9? 3 wholes.'},
      {q:'Which is 3 wholes as halves?', a:['3/2','6/2','2/3','3/3'], c:1, hint:'Each whole is 2/2, so 3 wholes = 6/2.'}
    ],
    game: smash([
      {q:'3/3', c:'1', opts:['0','1','3','1/3']},
      {q:'6/3', c:'2', opts:['1','2','3','6']},
      {q:'10/5', c:'2', opts:['1','2','5','10']},
      {q:'2/2', c:'1', opts:['0','1','2','1/2']},
      {q:'12/4', c:'3', opts:['2','3','4','8']},
      {q:'5/5', c:'1', opts:['0','1','5','1/5']}
    ]),
    post:[
      {q:'7/7 =', a:['0','1','7','1/7'], c:1},
      {q:'10/2 =', a:['2','5','8','12'], c:1},
      {q:'Which equals 2?', a:['2/4','4/2','2/8','8/2? wait 4'], c:1}
    ]
  },

  'Fractions Boss': {
    land:'frac',
    pre:[
      {q:'1/2 ○ 2/4', a:['>','<','='], c:2},
      {q:'3/8 ○ 6/8', a:['>','<','='], c:1},
      {q:'8/8 =', a:['0','1','8','1/8'], c:1}
    ],
    lesson: lessonHTML(
      'The Tide Crystal Trial',
      'Unit pieces, comparing, equivalents, the number line, and wholes. The cove crystal only yields if you can see fair shares.',
      kws(['unit','compare','equivalent','line','wholes']),
      '1/2 = 2/4 = 4/8 · 3/4 > 1/4 · 5/5 = 1'
    ),
    practice:[
      {q:'Which is a unit fraction?', a:['3/5','1/7','7/7','2/1'], c:1, hint:'Top is 1.'},
      {q:'3/6 = ?', a:['1/3','1/2','3/3','6/3'], c:1, hint:'Divide by 3.'},
      {q:'On 0–1, 1/8 is near…', a:['0','1/2','1','8'], c:0, hint:'Tiny piece near 0.'}
    ],
    game: smash([
      {q:'1/2 = ?', c:'4/8', opts:['1/8','3/8','4/8','8/4']},
      {q:'Bigger: 1/4 or 1/10', c:'1/4', opts:['1/4','1/10','same']},
      {q:'6/6', c:1, opts:[0,1,6,2]},
      {q:'5/8 ○ 3/8 →', c:'>', opts:['>','<','=']},
      {q:'2 of 3 equal parts', c:'2/3', opts:['1/3','2/3','3/2','2/2']},
      {q:'Middle tick', c:'1/2', opts:['0','1/2','1','2']}
    ], 50),
    post:[
      {q:'2/5 ○ 4/5', a:['>','<','='], c:1},
      {q:'2/8 = ?', a:['1/2','1/4','2/4','8/2'], c:1},
      {q:'9/3 =', a:['1','3','6','9'], c:1}
    ]
  },

  /* ===================== GEOMETRY ===================== */
  'Shapes': {
    land:'geo',
    pre:[
      {q:'A triangle has ___ sides.', a:['2','3','4','5'], c:1},
      {q:'A hexagon has ___ sides.', a:['4','5','6','8'], c:2},
      {q:'Which has 5 sides?', a:['triangle','square','pentagon','hexagon'], c:2}
    ],
    lesson: lessonHTML(
      'Count the SIDES',
      'Closed 2-D shapes are named by how many sides (and angles) they have. The ruins are full of them.',
      visGroups(['△ 3 triangle','□ 4 quadrilateral','⬠ 5 pentagon','⬡ 6 hexagon']),
      'Name it by the side count!'
    ),
    practice:[
      {q:'An octagon has ___ sides.', a:['6','7','8','10'], c:2, hint:'Octo- means 8, like octopus arms.'},
      {q:'Which is a triangle?', a:['4 equal sides','3 sides','6 sides','circle'], c:1, hint:'Tri = 3.'},
      {q:'A stop-sign shape is a…', a:['hexagon','octagon','pentagon','square'], c:1, hint:'Stop signs have 8 sides.'}
    ],
    game: smash([
      {q:'Triangle sides', c:3, opts:[2,3,4,5]},
      {q:'Square sides', c:4, opts:[3,4,5,6]},
      {q:'Pentagon sides', c:5, opts:[4,5,6,8]},
      {q:'Hexagon sides', c:6, opts:[5,6,7,8]},
      {q:'Octagon sides', c:8, opts:[6,7,8,10]},
      {q:'4-sided name', c:'quadrilateral', opts:['triangle','quadrilateral','pentagon','circle']}
    ]),
    post:[
      {q:'A pentagon has ___ angles.', a:['3','4','5','6'], c:2},
      {q:'Which has 6 sides?', a:['pentagon','hexagon','octagon','triangle'], c:1},
      {q:'A rectangle is a…', a:['triangle','quadrilateral','hexagon','circle'], c:1}
    ]
  },

  'Quadrilaterals': {
    land:'geo',
    pre:[
      {q:'A square has ___ equal sides.', a:['2','3','4','0'], c:2},
      {q:'A rectangle’s opposite sides are…', a:['unequal','equal','curved','3'], c:1},
      {q:'A rhombus has…', a:['4 equal sides','3 sides','no sides','one curve'], c:0}
    ],
    lesson: lessonHTML(
      'The family of 4-sided shapes',
      'Every quadrilateral has 4 sides. Squares, rectangles, rhombi, and trapezoids are special members with extra rules.',
      kws(['square: 4 equal + 4 right angles','rectangle: 4 right angles','rhombus: 4 equal sides','trapezoid: exactly 1 pair parallel']),
      'A square is a rectangle AND a rhombus!'
    ),
    practice:[
      {q:'Which is ALWAYS a rectangle?', a:['rhombus','square','trapezoid','triangle'], c:1, hint:'A square has 4 right angles, so it is a rectangle.'},
      {q:'A trapezoid has how many pairs of parallel sides (Grade 3: exactly)?', a:['0','1','2','4'], c:1, hint:'Exactly one pair of parallel sides.'},
      {q:'All sides equal, no right angles needed: ', a:['rectangle','rhombus','triangle','circle'], c:1, hint:'Rhombus = 4 equal sides.'}
    ],
    game: sortGame(
      [{id:'quad', label:'Quadrilateral', color:'#7b2ff7'}, {id:'no', label:'Not a quad', color:'#6a6386'}],
      [
        {text:'square', bin:'quad'},{text:'triangle', bin:'no'},{text:'rectangle', bin:'quad'},
        {text:'hexagon', bin:'no'},{text:'rhombus', bin:'quad'},{text:'pentagon', bin:'no'},
        {text:'trapezoid', bin:'quad'},{text:'circle', bin:'no'}
      ]
    ),
    post:[
      {q:'How many sides does every quadrilateral have?', a:['3','4','5','6'], c:1},
      {q:'A square has how many right angles?', a:['1','2','3','4'], c:3},
      {q:'Which is NOT a quadrilateral?', a:['rhombus','rectangle','pentagon','trapezoid'], c:2}
    ]
  },

  'Partition Shapes': {
    land:'geo',
    pre:[
      {q:'Split a square into 2 equal parts. Each is…', a:['1/3','1/2','1/4','2/2'], c:1},
      {q:'A rectangle in 4 equal squares. One square is…', a:['1/2','1/3','1/4','4'], c:2},
      {q:'3 equal parts of a shape are called…', a:['halves','thirds','fourths','wholes'], c:1}
    ],
    lesson: lessonHTML(
      'Fair cuts make fractions',
      'Partition means cut into equal shares. Two equal parts = halves. Three = thirds. Four = fourths. The pieces must be the SAME size, not just the same count of cuts.',
      visGroups(['halves 1/2','thirds 1/3','fourths 1/4']),
      'Equal parts → we can name each piece as a fraction of the whole'
    ),
    practice:[
      {q:'A circle in 4 equal slices. Two slices are…', a:['1/4','2/4','4/2','1/2 of 4'], c:1, hint:'2 of 4 equal parts = 2/4 (which is also 1/2).'},
      {q:'Which split is fair halves?', a:['one tiny piece, one huge','two matching parts','three matching parts','four random'], c:1, hint:'Halves = two EQUAL parts.'},
      {q:'A hexagon split into 6 equal triangles. One triangle is…', a:['1/3','1/6','1/2','6/1'], c:1, hint:'One of six equal parts → 1/6.'}
    ],
    game: smash([
      {q:'2 equal parts name', c:'halves', opts:['halves','thirds','fourths','wholes']},
      {q:'3 equal parts name', c:'thirds', opts:['halves','thirds','fourths','sixths']},
      {q:'4 equal parts name', c:'fourths', opts:['halves','thirds','fourths','eights']},
      {q:'2 of 4 equal parts', c:'2/4', opts:['1/4','2/4','4/2','1/2?']},
      {q:'1 of 3 equal parts', c:'1/3', opts:['1/2','1/3','3/1','1/4']},
      {q:'Fair split into 2', c:'halves', opts:['halves','thirds','unequal','none']}
    ]),
    post:[
      {q:'A square in 8 equal triangles. One is…', a:['1/4','1/8','8/1','1/2'], c:1},
      {q:'Two equal parts of a sandwich are…', a:['thirds','halves','fourths','eighths'], c:1},
      {q:'3 of 4 equal parts =', a:['1/4','3/4','4/3','3'], c:1}
    ]
  },

  'Area': {
    land:'geo',
    pre:[
      {q:'A 3-by-4 rectangle of unit squares has area…', a:['7','12','34','1'], c:1},
      {q:'Area of a 2-by-5 grid?', a:['7','10','25','3'], c:1},
      {q:'Area is measured in…', a:['unit squares','sides','angles','perimeters'], c:0}
    ],
    lesson: lessonHTML(
      'Area is how many squares cover it',
      'Cover a rectangle with unit squares. Rows × columns (or length × width) tells you the area without counting one-by-one.',
      visGroups(['■■■■','■■■■','■■■■']),
      '3 rows × 4 columns = <b>12</b> square units'
    ),
    practice:[
      {q:'Area of 5 by 3?', a:['8','15','53','2'], c:1, hint:'5 × 3 = 15 square units.'},
      {q:'A square with side 4 has area…', a:['8','12','16','44'], c:2, hint:'4 × 4 = 16.'},
      {q:'A garden 6 units long and 2 wide. Area?', a:['8','12','26','4'], c:1, hint:'6 × 2 = 12 square units.'}
    ],
    game: smash([
      {q:'2×6 area', c:12, opts:[8,12,26,4]},
      {q:'4×4 area', c:16, opts:[8,12,16,44]},
      {q:'3×5 area', c:15, opts:[8,15,35,10]},
      {q:'1×9 area', c:9, opts:[8,9,10,19]},
      {q:'5×5 area', c:25, opts:[10,20,25,55]},
      {q:'3×3 area', c:9, opts:[6,9,12,33]}
    ], 45, 'Smash the AREA (square units)!'),
    post:[
      {q:'Area of 7 by 2?', a:['9','14','72','5'], c:1},
      {q:'A square side 6. Area?', a:['12','24','36','66'], c:2},
      {q:'Which is area of 4×3?', a:['7','12','43','1'], c:1}
    ]
  },

  'Perimeter': {
    land:'geo',
    pre:[
      {q:'A 3-by-5 rectangle. Perimeter?', a:['8','15','16','30'], c:2},
      {q:'A square side 4. Perimeter?', a:['8','12','16','4'], c:2},
      {q:'Perimeter is the…', a:['inside squares','distance around','number of angles','area'], c:1}
    ],
    lesson: lessonHTML(
      'Perimeter is a WALK around the edge',
      'Add every side. For a rectangle you can do 2 × (length + width). For a square, 4 × side.',
      visGroups(['side 5','side 3','side 5','side 3']),
      '5+3+5+3 = <b>16</b> units'
    ),
    practice:[
      {q:'Rectangle 6 by 2. Perimeter?', a:['8','12','16','24'], c:2, hint:'6+2+6+2 = 16. Or 2×(6+2)=16.'},
      {q:'Square side 5. Perimeter?', a:['10','20','25','5'], c:1, hint:'4 × 5 = 20.'},
      {q:'A triangle with sides 4, 5, 6. Perimeter?', a:['12','15','24','45'], c:1, hint:'Add: 4+5+6=15.'}
    ],
    game: smash([
      {q:'Square side 3, P?', c:12, opts:[6,9,12,3]},
      {q:'Rect 4 by 2, P?', c:12, opts:[6,8,12,16]},
      {q:'Rect 5 by 5, P?', c:20, opts:[10,20,25,55]},
      {q:'Sides 2+3+4+5', c:14, opts:[9,14,2345,10]},
      {q:'Square side 6, P?', c:24, opts:[12,24,36,6]},
      {q:'Rect 7 by 1, P?', c:16, opts:[8,14,16,71]}
    ]),
    post:[
      {q:'Rectangle 8 by 3. Perimeter?', a:['11','22','24','48'], c:2},
      {q:'Square side 7. Perimeter?', a:['14','28','49','7'], c:1},
      {q:'Area 3×4 is 12. Perimeter is…', a:['7','12','14','34'], c:2}
    ]
  },

  'Geometry Boss': {
    land:'geo',
    pre:[
      {q:'Hexagon sides?', a:['5','6','7','8'], c:1},
      {q:'Area of 3×6?', a:['9','18','36','63'], c:1},
      {q:'Square side 4. Perimeter?', a:['8','12','16','4'], c:2}
    ],
    lesson: lessonHTML(
      'The Ruin Crystal Trial',
      'Names, quads, equal shares, area, and perimeter — the stone crystal wants a true shape ranger.',
      kws(['sides','quads','partition','area','perimeter']),
      'Area = squares inside · Perimeter = walk around'
    ),
    practice:[
      {q:'A rhombus is a…', a:['triangle','quadrilateral','hexagon','circle'], c:1, hint:'4 sides.'},
      {q:'Halves means…', a:['2 equal parts','3 equal parts','4 equal parts','no cuts'], c:0, hint:'Two matching pieces.'},
      {q:'Area of 2×8?', a:['10','16','28','4'], c:1, hint:'2 × 8 = 16 square units.'}
    ],
    game: smash([
      {q:'Pentagon sides', c:5, opts:[4,5,6,8]},
      {q:'4×3 area', c:12, opts:[7,12,43,1]},
      {q:'Square side 2, P?', c:8, opts:[4,6,8,2]},
      {q:'4 equal parts', c:'fourths', opts:['halves','thirds','fourths']},
      {q:'Always 4 sides', c:'quadrilateral', opts:['triangle','quadrilateral','pentagon']},
      {q:'Rect 5 by 2, P?', c:14, opts:[7,10,14,52]}
    ], 50),
    post:[
      {q:'Octagon sides?', a:['6','7','8','10'], c:2},
      {q:'Area of 5×6?', a:['11','30','56','1'], c:1},
      {q:'Triangle sides 5,5,6. Perimeter?', a:['11','16','30','5'], c:1}
    ]
  },

  /* ===================== DATA ===================== */
  'Picture Graphs': {
    land:'data',
    pre:[
      {q:'A key says ☺ = 2 votes. 3 smileys mean…', a:['3','5','6','2'], c:2},
      {q:'If 🍎 = 1, five apples show…', a:['1','4','5','6'], c:2},
      {q:'2 rows: 4 cats and 2 cats. How many more cats in the first?', a:['2','4','6','8'], c:0}
    ],
    lesson: lessonHTML(
      'Each picture is a KEY',
      'Picture graphs use pictures instead of bars. Always read the key: one picture might mean 1, 2, or even 5. Count pictures, then multiply by the key.',
      visGroups(['☺ = 2','☺☺☺ = 6']),
      '3 pictures × 2 each = <b>6</b>'
    ),
    practice:[
      {q:'⭐ = 5 points. 4 stars = ?', a:['4','9','20','45'], c:2, hint:'4 × 5 = 20.'},
      {q:'A graph shows 🐶🐶 vs 🐶🐶🐶🐶. How many more on the right if 🐶=1?', a:['2','4','6','1'], c:0, hint:'4 − 2 = 2 more.'},
      {q:'Key: 🐟 = 2. Total fish if 5 pictures?', a:['5','7','10','25'], c:2, hint:'5 × 2 = 10.'}
    ],
    game: smash([
      {q:'☺=2, 4 ☺', c:8, opts:[4,6,8,2]},
      {q:'🍎=1, 7 🍎', c:7, opts:[1,6,7,8]},
      {q:'⭐=5, 3 ⭐', c:15, opts:[3,8,15,35]},
      {q:'🐶=2, 6 🐶', c:12, opts:[6,8,12,26]},
      {q:'How many more: 5 vs 2', c:3, opts:[2,3,5,7]},
      {q:'☺=10, 2 ☺', c:20, opts:[2,10,12,20]}
    ]),
    post:[
      {q:'Key 🎈=2. 6 balloons pictured = ?', a:['6','8','12','26'], c:2},
      {q:'3 🐱 vs 8 🐱 (🐱=1). How many more?', a:['3','5','8','11'], c:1},
      {q:'⭐=5. Two and a half stars (think 2 ⭐ + half of 5)?', a:['7','10','12','15'], c:2}
    ]
  },

  'Bar Graphs': {
    land:'data',
    pre:[
      {q:'A bar stops at 8. That category has…', a:['0','4','8','80'], c:2},
      {q:'Bars: red 6, blue 4. How many more red?', a:['2','4','6','10'], c:0},
      {q:'Bars 3, 5, and 2. Total?', a:['7','8','10','15'], c:2}
    ],
    lesson: lessonHTML(
      'Read the HEIGHT',
      'A bar graph compares categories. Match the top of the bar to the number on the scale. Then you can ask “how many more?” or “how many in all?”',
      visGroups(['Scale: 2,4,6,8','Bar to 6 → 6']),
      'Height = the count for that category'
    ),
    practice:[
      {q:'Dogs 9, cats 5. How many more dogs?', a:['4','5','9','14'], c:0, hint:'Subtract: 9 − 5 = 4.'},
      {q:'Pizza 7, tacos 7, salad 2. Which is least?', a:['pizza','tacos','salad','tie'], c:2, hint:'The shortest bar is salad (2).'},
      {q:'A, B, C = 4, 6, 5. Total votes?', a:['10','15','16','456'], c:1, hint:'4+6+5=15.'}
    ],
    game: smash([
      {q:'Bar at 10', c:10, opts:[5,8,10,20]},
      {q:'9 vs 4, more?', c:5, opts:[4,5,9,13]},
      {q:'2+5+3 total', c:10, opts:[7,8,10,253]},
      {q:'Least of 8,3,6', c:3, opts:[3,6,8,17]},
      {q:'Greatest of 4,11,7', c:11, opts:[4,7,11,22]},
      {q:'6 vs 6, more?', c:0, opts:[0,6,12,1]}
    ]),
    post:[
      {q:'Green 12, yellow 5. How many more green?', a:['5','7','12','17'], c:1},
      {q:'Bars 4, 4, 4. Total?', a:['4','8','12','44'], c:2},
      {q:'Scale counts by 2s. Bar 3 ticks up is…', a:['3','5','6','8'], c:2}
    ]
  },

  'Line Plots': {
    land:'data',
    pre:[
      {q:'A line plot shows Xs over 4,4,5. How many data points?', a:['3','4','5','13'], c:0},
      {q:'Most Xs sit on 6. The mode is…', a:['0','6','the smallest','X'], c:1},
      {q:'Xs: 2, 2, 2, 5. How many 2s?', a:['1','2','3','5'], c:2}
    ],
    lesson: lessonHTML(
      'Xs on a number line',
      'A line plot is a number line with an X for each measurement. Stacked Xs mean that number showed up more than once. Super for lengths and survey results.',
      visGroups(['2: X','3: XXX','4: XX']),
      '3 is the most common (3 Xs)'
    ),
    practice:[
      {q:'Xs over 10: 4 of them. How many kids jumped 10 units?', a:['4','10','14','1'], c:0, hint:'Each X is one kid. 4 Xs = 4 kids.'},
      {q:'Plot: 1 has 1 X, 2 has 5 Xs, 3 has 2 Xs. Most common?', a:['1','2','3','5'], c:1, hint:'Tallest stack is on 2.'},
      {q:'Total Xs: 2 + 3 + 1 = ? (how many measurements)', a:['3','5','6','231'], c:2, hint:'Add the stacks: 6 measurements.'}
    ],
    game: smash([
      {q:'5 Xs on 8 → count of 8s', c:5, opts:[5,8,13,1]},
      {q:'Stacks 1,4,2. Total X', c:7, opts:[3,6,7,142]},
      {q:'Tallest stack = mode. Stacks 2,6,3 → mode pos count', c:6, opts:[2,3,6,11]},
      {q:'0 Xs on 9 means', c:0, opts:[0,9,1,10]},
      {q:'2 Xs + 2 Xs', c:4, opts:[2,3,4,22]},
      {q:'How many more: 7 Xs vs 3 Xs', c:4, opts:[3,4,7,10]}
    ]),
    post:[
      {q:'A plot has 6 Xs total. How many measurements?', a:['1','6','X','0'], c:1},
      {q:'Most Xs on 12. Typical value is…', a:['6','12','the line','0'], c:1},
      {q:'3 Xs on 5 and 1 X on 6. How many more 5s?', a:['1','2','3','4'], c:1}
    ]
  },

  'Measure & Graph': {
    land:'data',
    pre:[
      {q:'A ribbon to the 6-inch mark is ___ inches.', a:['5','6','7','60'], c:1},
      {q:'Nearest inch: a pencil between 4 and 5, closer to 5.', a:['4','5','4.5','9'], c:1},
      {q:'We measured 3 twigs: 2, 4, 2 in. How many 2-inch twigs?', a:['1','2','3','4'], c:1}
    ],
    lesson: lessonHTML(
      'Measure, then plot',
      'Line up the object with 0 on the ruler. Read the nearest inch (or half-inch). Then each length becomes an X on a line plot.',
      visGroups(['ruler: 0→4 in','X over 4']),
      'Measure → mark → the plot tells the story'
    ),
    practice:[
      {q:'Lengths 3, 3, 5, 3 inches. How many 3-inch objects?', a:['1','2','3','5'], c:2, hint:'Count how many times 3 appears: three times.'},
      {q:'A crayon ends halfway between 6 and 7, nearest inch if we round typical 3rd grade (closer… it’s the midpoint — round up is OK). Many classes call it 6 or 7. Nearest? Use 7 if 6.5.', a:['6','7','13','1'], c:1, hint:'Halfway usually rounds to 7 inches.'},
      {q:'Plots of 4, 4, 4, 8. Total inches if we added them?', a:['16','20','12','8'], c:1, hint:'4+4+4+8=20.'}
    ],
    game: smash([
      {q:'Mark at 9 in', c:9, opts:[8,9,10,90]},
      {q:'3 objects of 5 in, total', c:15, opts:[5,8,15,35]},
      {q:'How many 6s: 6,7,6,6', c:3, opts:[1,2,3,6]},
      {q:'Nearest inch to 2.2', c:2, opts:[2,3,22,1]},
      {q:'Nearest inch to 4.8', c:5, opts:[4,5,48,8]},
      {q:'2 in + 5 in', c:7, opts:[3,7,10,25]}
    ]),
    post:[
      {q:'Lengths 7, 2, 7. How many 7-inch?', a:['1','2','3','7'], c:1},
      {q:'Nearest inch to 10.4', a:['10','11','4','14'], c:0},
      {q:'Three 4-inch ribbons. Total length?', a:['4','7','12','43'], c:2}
    ]
  },

  'Interpret Data': {
    land:'data',
    pre:[
      {q:'Sold 12 cupcakes Monday, 5 Tuesday. How many more Monday?', a:['5','7','12','17'], c:1},
      {q:'Rain: 2, 0, 4, 3 cm. Total rain?', a:['7','9','10','243'], c:1},
      {q:'Favorite: 8 pizza, 8 tacos. They are…', a:['tied','pizza wins','tacos win','zero'], c:0}
    ],
    lesson: lessonHTML(
      'Ask the graph a question',
      'Data answers stories: how many more, how many in all, which is most, which is least. Subtract to compare, add for totals.',
      kws(['how many more → subtract','in all → add','most / least → compare']),
      '12 − 5 = <b>7</b> more · 8 + 8 = <b>16</b> in all'
    ),
    practice:[
      {q:'Buses: 15, 9, 6. How many more first than last?', a:['6','9','15','30'], c:1, hint:'15 − 6 = 9.'},
      {q:'Stickers 4 + 7 + 5. In all?', a:['11','16','47','12'], c:1, hint:'4+7+5=16.'},
      {q:'Least of 11, 3, 14, 8?', a:['11','3','14','8'], c:1, hint:'Smallest number is 3.'}
    ],
    game: smash([
      {q:'10 vs 3, more?', c:7, opts:[3,7,10,13]},
      {q:'5+5+5 in all', c:15, opts:[5,10,15,555]},
      {q:'Least: 9,2,6', c:2, opts:[2,6,9,17]},
      {q:'Most: 4,12,8', c:12, opts:[4,8,12,24]},
      {q:'20 − 11 more', c:9, opts:[9,11,20,31]},
      {q:'Tied 7 and 7, more?', c:0, opts:[0,7,14,1]}
    ]),
    post:[
      {q:'Goals 8, 8, 2. How many more in a tie game vs last?', a:['0','6','8','10'], c:1},
      {q:'3+6+9 in all?', a:['12','18','36','369'], c:1},
      {q:'Greatest: 21, 12, 18', a:['12','18','21'], c:2}
    ]
  },

  'Data Boss': {
    land:'data',
    pre:[
      {q:'☺=2, 5 ☺ = ?', a:['5','7','10','25'], c:2},
      {q:'Bars 6 and 10. How many more on the 10?', a:['4','6','10','16'], c:0},
      {q:'4 Xs on 3 inches. How many objects were 3 in?', a:['3','4','7','1'], c:1}
    ],
    lesson: lessonHTML(
      'The Forest Crystal Trial',
      'Pictures, bars, plots, measuring, and story questions. Whisperwood only opens for a data detective.',
      kws(['key','height','Xs','measure','how many more']),
      'Read the key. Read the scale. Then ask a question.'
    ),
    practice:[
      {q:'⭐=5. 6 stars = ?', a:['6','11','30','56'], c:2, hint:'6 × 5 = 30.'},
      {q:'Line plot stacks 2, 2, 5. Total measurements?', a:['5','7','9','225'], c:2, hint:'2+2+5=9.'},
      {q:'9 vs 4. How many more?', a:['4','5','9','13'], c:1, hint:'9 − 4 = 5.'}
    ],
    game: smash([
      {q:'🍎=2, 3 🍎', c:6, opts:[3,5,6,23]},
      {q:'Bar 8 vs 3, more', c:5, opts:[3,5,8,11]},
      {q:'Xs: 4+1', c:5, opts:[3,4,5,41]},
      {q:'Least 11,7,15', c:7, opts:[7,11,15,33]},
      {q:'2+6+4 total', c:12, opts:[8,10,12,264]},
      {q:'Nearest inch 7.6', c:8, opts:[7,8,76,6]}
    ], 50),
    post:[
      {q:'Key 🐟=2. 8 pictures = ?', a:['8','10','16','28'], c:2},
      {q:'Plot: 5 Xs on 4, 2 Xs on 5. How many more 4s?', a:['2','3','5','7'], c:1},
      {q:'12, 5, 7 in all?', a:['12','17','24','125'], c:2}
    ]
  }
};

/* Fix a few items that used placeholder-y answers */
QUEST_CONTENT['Subtract Decimals'].pre[1] = {q:'0.60 − 0.20 =', a:['0.80','0.40','0.08','6'], c:1};
QUEST_CONTENT['Subtract Decimals'].post[2] = {q:'0.32 − 0.12 =', a:['0.20','0.44','0.021','2'], c:0};
QUEST_CONTENT['Subtract Decimals'].practice[2] = {q:'1.00 − 0.40 =', a:['0.60','1.40','0.06','1.04'], c:0};
QUEST_CONTENT['Wholes as Fractions'].post[2] = {q:'Which equals 2?', a:['2/4','4/2','2/8','3/2'], c:1};
QUEST_CONTENT['Partition Shapes'].game.problems[3] = {q:'2 of 4 equal parts', c:'2/4', opts:['1/4','2/4','4/2','3/4']};
QUEST_CONTENT['Compare and Order Whole Numbers'].game.intro = 'Put each number in the matching bin. 500 goes with 500 or more.';
QUEST_CONTENT['Add Decimals'].game.problems[4] = {q:'0.09 + 0.01', c:'0.10', opts:['0.10','0.010','0.9','0.08']};
QUEST_CONTENT['Decimal Boss'].game.problems[3] = {q:'0.6 − 0.2', c:'0.4', opts:['0.4','0.8','0.04','0.62']};
QUEST_CONTENT['Decimal Boss'].game.problems[4] = {q:'0.70 compared to 0.7', c:'=', opts:['>','<','=','+']};
QUEST_CONTENT['Decimal Boss'].game.problems[5] = {q:'0.09 + 0.11', c:'0.20', opts:['0.20','0.02','1.01','0.19']};

const DIAG_ITEMS = [
  { land:'place', q:'The 6 in 365 is worth…', a:['6','60','600','16'], c:1 },
  { land:'place', q:'3 dimes are worth…', a:['3¢','12¢','30¢','300¢'], c:2 },
  { land:'mult', q:'4 × 6 =', a:['10','18','24','46'], c:2 },
  { land:'mult', q:'18 ÷ 3 =', a:['5','6','8','15'], c:1 },
  { land:'dec', q:'0.4 means…', a:['4 ones','4 tenths','4 hundredths','40'], c:1 },
  { land:'dec', q:'0.7 ○ 0.70', a:['>','<','='], c:2 },
  { land:'frac', q:'Which is greater?', a:['1/8','1/2','they are equal','1/10'], c:1 },
  { land:'frac', q:'1/2 = ?', a:['1/4','2/4','2/2','1/3'], c:1 },
  { land:'geo', q:'A hexagon has ___ sides.', a:['5','6','7','8'], c:1 },
  { land:'geo', q:'Area of a 3-by-5 rectangle?', a:['8','15','35','2'], c:1 },
  { land:'data', q:'Bar at 9 vs bar at 4. How many more?', a:['4','5','9','13'], c:1 },
  { land:'data', q:'Key: ☺ = 2. 4 smileys mean…', a:['4','6','8','2'], c:2 }
];

function landOfQuest(title){
  const q = QUEST_CONTENT[title];
  if(q) return q.land;
  for(const k of LAND_KEYS){
    if(LANDS[k].quests.some(x => x.name===title)) return k;
  }
  return null;
}

function buddyLineForLand(key){
  return (LANDS[key] && LANDS[key].buddy) || 'Complete quests to level up and unlock new lands.';
}
