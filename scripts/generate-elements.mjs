/**
 * ATOMIC - 원소 데이터 생성기
 *
 * 118개 원소의 기본 표를 바탕으로
 *  - 전자배치(아우프바우 + 바닥상태 예외)
 *  - 보어 모형 껍질 전자수
 *  - 주기 / 족 / 주기율표 좌표
 * 를 계산해서 src/data/elements.json 을 만든다.
 *
 * 실행: node scripts/generate-elements.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/* ------------------------------------------------------------------ *
 * 1. 기본 표: [번호, 기호, 한글이름, 영문이름, 원자량, 분류, 상태, 설명, 별칭[]]
 * ------------------------------------------------------------------ */
const C = {
  alkali: 'alkali',
  alkaline: 'alkaline',
  transition: 'transition',
  lanthanide: 'lanthanide',
  actinide: 'actinide',
  metalloid: 'metalloid',
  nonmetal: 'nonmetal',
  halogen: 'halogen',
  noble: 'noble',
  post: 'post',
}
const S = { s: 'solid', l: 'liquid', g: 'gas' }

const TABLE = [
  [1, 'H', '수소', 'Hydrogen', 1.008, C.nonmetal, S.g, '우주에서 가장 많고 가장 가벼운 원소. 물과 대부분의 유기물에 들어 있다.'],
  [2, 'He', '헬륨', 'Helium', 4.0026, C.noble, S.g, '두 번째로 가벼운 기체. 반응하지 않아 풍선과 극저온 냉각에 쓰인다.'],
  [3, 'Li', '리튬', 'Lithium', 6.94, C.alkali, S.s, '가장 가벼운 금속. 충전지의 핵심 재료다.'],
  [4, 'Be', '베릴륨', 'Beryllium', 9.0122, C.alkaline, S.s, '가볍고 단단한 금속. X선 창과 항공 부품에 쓰인다.'],
  [5, 'B', '붕소', 'Boron', 10.81, C.metalloid, S.s, '유리를 튼튼하게 만드는 준금속. 내열유리에 들어간다.'],
  [6, 'C', '탄소', 'Carbon', 12.011, C.nonmetal, S.s, '생명체를 이루는 뼈대 원소. 다이아몬드와 흑연이 모두 탄소다.'],
  [7, 'N', '질소', 'Nitrogen', 14.007, C.nonmetal, S.g, '공기의 약 78%를 차지한다. 질소 비료의 원료다.'],
  [8, 'O', '산소', 'Oxygen', 15.999, C.nonmetal, S.g, '호흡과 연소에 반드시 필요하다. 지각에서 가장 흔한 원소다.'],
  [9, 'F', '플루오린', 'Fluorine', 18.998, C.halogen, S.g, '반응성이 가장 큰 원소. 치약의 충치 예방 성분이다.', ['불소']],
  [10, 'Ne', '네온', 'Neon', 20.18, C.noble, S.g, '전기를 흘리면 붉은 주황빛을 낸다. 네온사인의 주인공이다.'],
  [11, 'Na', '나트륨', 'Sodium', 22.99, C.alkali, S.s, '물에 넣으면 격렬히 반응한다. 소금(NaCl)의 절반이다.', ['소듐']],
  [12, 'Mg', '마그네슘', 'Magnesium', 24.305, C.alkaline, S.s, '가벼운 구조용 금속이자 엽록소의 중심 원자다.'],
  [13, 'Al', '알루미늄', 'Aluminium', 26.982, C.post, S.s, '가볍고 녹슬지 않는다. 캔과 창틀에 흔히 쓰인다.'],
  [14, 'Si', '규소', 'Silicon', 28.085, C.metalloid, S.s, '반도체와 유리의 핵심. 지각에서 산소 다음으로 많다.', ['실리콘']],
  [15, 'P', '인', 'Phosphorus', 30.974, C.nonmetal, S.s, 'DNA와 뼈에 들어 있다. 성냥 머리의 재료이기도 하다.'],
  [16, 'S', '황', 'Sulfur', 32.06, C.nonmetal, S.s, '노란 고체로 화산 근처에서 발견된다. 황산의 원료다.', ['유황']],
  [17, 'Cl', '염소', 'Chlorine', 35.45, C.halogen, S.g, '수돗물 소독에 쓰이는 자극성 기체. 소금의 나머지 절반이다.'],
  [18, 'Ar', '아르곤', 'Argon', 39.948, C.noble, S.g, '공기 중 세 번째로 많은 기체. 용접 보호 기체로 쓴다.'],
  [19, 'K', '칼륨', 'Potassium', 39.098, C.alkali, S.s, '세포 활동에 꼭 필요한 금속. 바나나에 많다.', ['포타슘']],
  [20, 'Ca', '칼슘', 'Calcium', 40.078, C.alkaline, S.s, '뼈와 이의 주성분. 석회암과 조개껍데기에도 들어 있다.'],
  [21, 'Sc', '스칸듐', 'Scandium', 44.956, C.transition, S.s, '가벼운 고성능 합금에 쓰이는 희귀 금속이다.'],
  [22, 'Ti', '타이타늄', 'Titanium', 47.867, C.transition, S.s, '강철만큼 튼튼하면서 훨씬 가볍다. 인공관절에 쓰인다.', ['티타늄']],
  [23, 'V', '바나듐', 'Vanadium', 50.942, C.transition, S.s, '강철을 질기게 만드는 첨가 금속이다.'],
  [24, 'Cr', '크로뮴', 'Chromium', 51.996, C.transition, S.s, '스테인리스강을 녹슬지 않게 해 주는 금속이다.', ['크롬']],
  [25, 'Mn', '망가니즈', 'Manganese', 54.938, C.transition, S.s, '건전지와 강철에 들어가는 금속이다.', ['망간']],
  [26, 'Fe', '철', 'Iron', 55.845, C.transition, S.s, '가장 널리 쓰이는 금속이자 혈액 헤모글로빈의 중심이다.'],
  [27, 'Co', '코발트', 'Cobalt', 58.933, C.transition, S.s, '푸른 안료와 리튬이온 배터리 양극재에 쓰인다.'],
  [28, 'Ni', '니켈', 'Nickel', 58.693, C.transition, S.s, '동전과 스테인리스강에 들어가는 은백색 금속이다.'],
  [29, 'Cu', '구리', 'Copper', 63.546, C.transition, S.s, '전기가 아주 잘 통해 전선에 쓰인다.', ['동']],
  [30, 'Zn', '아연', 'Zinc', 65.38, C.transition, S.s, '철의 부식을 막는 도금에 쓰인다. 면역에도 필요하다.'],
  [31, 'Ga', '갈륨', 'Gallium', 69.723, C.post, S.s, '손바닥 위에서 녹는 금속. LED 반도체 재료다.'],
  [32, 'Ge', '저마늄', 'Germanium', 72.63, C.metalloid, S.s, '초기 트랜지스터의 재료. 지금은 광섬유에 쓰인다.', ['게르마늄']],
  [33, 'As', '비소', 'Arsenic', 74.922, C.metalloid, S.s, '독성이 강한 준금속. 반도체 도핑에도 쓰인다.'],
  [34, 'Se', '셀레늄', 'Selenium', 78.971, C.nonmetal, S.s, '빛을 받으면 전기가 잘 통한다. 복사기에 쓰였다.'],
  [35, 'Br', '브로민', 'Bromine', 79.904, C.halogen, S.l, '상온에서 액체인 두 원소 중 하나. 붉은 갈색이다.', ['브롬']],
  [36, 'Kr', '크립톤', 'Krypton', 83.798, C.noble, S.g, '고성능 조명에 쓰이는 비활성 기체다.'],
  [37, 'Rb', '루비듐', 'Rubidium', 85.468, C.alkali, S.s, '원자시계와 연구용으로 쓰이는 알칼리 금속이다.'],
  [38, 'Sr', '스트론튬', 'Strontium', 87.62, C.alkaline, S.s, '불꽃놀이의 붉은색을 내는 금속이다.'],
  [39, 'Y', '이트륨', 'Yttrium', 88.906, C.transition, S.s, 'LED 형광체와 초전도체에 쓰인다.'],
  [40, 'Zr', '지르코늄', 'Zirconium', 91.224, C.transition, S.s, '부식에 강해 원자로 부품에 쓰인다.'],
  [41, 'Nb', '나이오븀', 'Niobium', 92.906, C.transition, S.s, '초전도 자석에 쓰이는 금속이다.', ['니오브']],
  [42, 'Mo', '몰리브데넘', 'Molybdenum', 95.95, C.transition, S.s, '고온에 견디는 강철 합금 재료다.', ['몰리브덴']],
  [43, 'Tc', '테크네튬', 'Technetium', 98, C.transition, S.s, '인공으로 처음 만들어진 원소. 의료 영상에 쓰인다.'],
  [44, 'Ru', '루테늄', 'Ruthenium', 101.07, C.transition, S.s, '전자 접점과 촉매에 쓰이는 백금족 금속이다.'],
  [45, 'Rh', '로듐', 'Rhodium', 102.91, C.transition, S.s, '자동차 배기가스 정화 촉매의 핵심이다.'],
  [46, 'Pd', '팔라듐', 'Palladium', 106.42, C.transition, S.s, '수소를 잘 흡수한다. 촉매 변환기에 쓰인다.'],
  [47, 'Ag', '은', 'Silver', 107.87, C.transition, S.s, '모든 금속 중 전기와 열을 가장 잘 전달한다.'],
  [48, 'Cd', '카드뮴', 'Cadmium', 112.41, C.transition, S.s, '독성이 있는 금속. 예전 충전지에 쓰였다.'],
  [49, 'In', '인듐', 'Indium', 114.82, C.post, S.s, '터치스크린 투명 전극(ITO)의 재료다.'],
  [50, 'Sn', '주석', 'Tin', 118.71, C.post, S.s, '청동의 재료이자 납땜에 쓰인다.'],
  [51, 'Sb', '안티모니', 'Antimony', 121.76, C.metalloid, S.s, '난연제와 납 합금에 쓰이는 준금속이다.', ['안티몬']],
  [52, 'Te', '텔루륨', 'Tellurium', 127.6, C.metalloid, S.s, '태양전지와 열전 소자에 쓰인다.'],
  [53, 'I', '아이오딘', 'Iodine', 126.9, C.halogen, S.s, '갑상샘 호르몬에 필요하다. 소독약으로도 쓰인다.', ['요오드']],
  [54, 'Xe', '제논', 'Xenon', 131.29, C.noble, S.g, '자동차 헤드램프와 이온 추진기에 쓰인다.', ['크세논']],
  [55, 'Cs', '세슘', 'Caesium', 132.91, C.alkali, S.s, '1초의 길이를 정하는 원자시계의 기준 원소다.'],
  [56, 'Ba', '바륨', 'Barium', 137.33, C.alkaline, S.s, '위장 X선 촬영 조영제로 쓰인다.'],
  [57, 'La', '란타넘', 'Lanthanum', 138.91, C.lanthanide, S.s, '란타넘족의 첫 원소. 카메라 렌즈 유리에 쓰인다.', ['란탄']],
  [58, 'Ce', '세륨', 'Cerium', 140.12, C.lanthanide, S.s, '가장 흔한 희토류. 유리 연마제와 촉매에 쓰인다.'],
  [59, 'Pr', '프라세오디뮴', 'Praseodymium', 140.91, C.lanthanide, S.s, '강력한 자석과 용접용 보안경 유리에 쓰인다.'],
  [60, 'Nd', '네오디뮴', 'Neodymium', 144.24, C.lanthanide, S.s, '세상에서 가장 강한 영구자석의 재료다.'],
  [61, 'Pm', '프로메튬', 'Promethium', 145, C.lanthanide, S.s, '자연에 거의 없는 방사성 희토류다.'],
  [62, 'Sm', '사마륨', 'Samarium', 150.36, C.lanthanide, S.s, '고온에서도 힘을 유지하는 자석 재료다.'],
  [63, 'Eu', '유로퓸', 'Europium', 151.96, C.lanthanide, S.s, '디스플레이의 붉은 형광체로 쓰인다.'],
  [64, 'Gd', '가돌리늄', 'Gadolinium', 157.25, C.lanthanide, S.s, 'MRI 조영제에 쓰이는 희토류다.'],
  [65, 'Tb', '터븀', 'Terbium', 158.93, C.lanthanide, S.s, '녹색 형광체와 자기변형 소재에 쓰인다.'],
  [66, 'Dy', '디스프로슘', 'Dysprosium', 162.5, C.lanthanide, S.s, '고온용 자석에 첨가되는 희토류다.'],
  [67, 'Ho', '홀뮴', 'Holmium', 164.93, C.lanthanide, S.s, '의료용 레이저에 쓰인다.'],
  [68, 'Er', '어븀', 'Erbium', 167.26, C.lanthanide, S.s, '광섬유 증폭기의 핵심 원소다.'],
  [69, 'Tm', '툴륨', 'Thulium', 168.93, C.lanthanide, S.s, '휴대용 X선 장치에 쓰이는 희귀 희토류다.'],
  [70, 'Yb', '이터븀', 'Ytterbium', 173.05, C.lanthanide, S.s, '초정밀 광격자 원자시계에 쓰인다.'],
  [71, 'Lu', '루테튬', 'Lutetium', 174.97, C.lanthanide, S.s, '란타넘족의 마지막 원소. PET 검출기에 쓰인다.'],
  [72, 'Hf', '하프늄', 'Hafnium', 178.49, C.transition, S.s, '원자로 제어봉과 최신 반도체 절연막에 쓰인다.'],
  [73, 'Ta', '탄탈럼', 'Tantalum', 180.95, C.transition, S.s, '소형 커패시터의 필수 금속이다.', ['탄탈']],
  [74, 'W', '텅스텐', 'Tungsten', 183.84, C.transition, S.s, '녹는점이 가장 높은 금속. 백열전구 필라멘트였다.'],
  [75, 'Re', '레늄', 'Rhenium', 186.21, C.transition, S.s, '제트엔진 터빈 날개 합금에 쓰인다.'],
  [76, 'Os', '오스뮴', 'Osmium', 190.23, C.transition, S.s, '가장 밀도가 큰 원소 중 하나다.'],
  [77, 'Ir', '이리듐', 'Iridium', 192.22, C.transition, S.s, '부식에 가장 강한 금속. 점화 플러그에 쓰인다.'],
  [78, 'Pt', '백금', 'Platinum', 195.08, C.transition, S.s, '변하지 않는 귀금속이자 뛰어난 촉매다.', ['플래티넘']],
  [79, 'Au', '금', 'Gold', 196.97, C.transition, S.s, '변색되지 않는 귀금속. 전자 접점에도 쓰인다.'],
  [80, 'Hg', '수은', 'Mercury', 200.59, C.transition, S.l, '상온에서 액체인 유일한 금속이다.'],
  [81, 'Tl', '탈륨', 'Thallium', 204.38, C.post, S.s, '독성이 매우 강한 금속이다.'],
  [82, 'Pb', '납', 'Lead', 207.2, C.post, S.s, '무겁고 방사선을 잘 막는다. 자동차 배터리에 쓰인다.'],
  [83, 'Bi', '비스무트', 'Bismuth', 208.98, C.post, S.s, '무지개빛 결정을 만드는 무거운 금속이다.', ['비스무스']],
  [84, 'Po', '폴로늄', 'Polonium', 209, C.post, S.s, '퀴리 부부가 발견한 강한 방사성 원소다.'],
  [85, 'At', '아스타틴', 'Astatine', 210, C.halogen, S.s, '자연에 가장 적게 존재하는 원소다.'],
  [86, 'Rn', '라돈', 'Radon', 222, C.noble, S.g, '땅에서 새어 나오는 방사성 기체다.'],
  [87, 'Fr', '프랑슘', 'Francium', 223, C.alkali, S.s, '반응성이 가장 큰 금속. 극히 불안정하다.'],
  [88, 'Ra', '라듐', 'Radium', 226, C.alkaline, S.s, '퀴리 부인이 발견한 빛나는 방사성 금속이다.'],
  [89, 'Ac', '악티늄', 'Actinium', 227, C.actinide, S.s, '악티늄족의 첫 원소. 어둠 속에서 푸르게 빛난다.'],
  [90, 'Th', '토륨', 'Thorium', 232.04, C.actinide, S.s, '차세대 원자로 연료 후보로 꼽힌다.'],
  [91, 'Pa', '프로트악티늄', 'Protactinium', 231.04, C.actinide, S.s, '희귀하고 다루기 어려운 방사성 금속이다.'],
  [92, 'U', '우라늄', 'Uranium', 238.03, C.actinide, S.s, '원자력 발전의 연료가 되는 원소다.'],
  [93, 'Np', '넵투늄', 'Neptunium', 237, C.actinide, S.s, '우라늄 다음으로 만들어진 첫 초우라늄 원소다.'],
  [94, 'Pu', '플루토늄', 'Plutonium', 244, C.actinide, S.s, '핵연료와 우주 탐사선 전원에 쓰인다.'],
  [95, 'Am', '아메리슘', 'Americium', 243, C.actinide, S.s, '화재감지기에 실제로 들어가는 방사성 원소다.'],
  [96, 'Cm', '퀴륨', 'Curium', 247, C.actinide, S.s, '퀴리 부부의 이름을 딴 인공 원소다.'],
  [97, 'Bk', '버클륨', 'Berkelium', 247, C.actinide, S.s, '버클리 대학에서 처음 만들어졌다.'],
  [98, 'Cf', '캘리포늄', 'Californium', 251, C.actinide, S.s, '강력한 중성자원으로 쓰이는 인공 원소다.'],
  [99, 'Es', '아인슈타이늄', 'Einsteinium', 252, C.actinide, S.s, '수소폭탄 실험 잔해에서 발견되었다.'],
  [100, 'Fm', '페르뮴', 'Fermium', 257, C.actinide, S.s, '물리학자 페르미의 이름을 땄다.'],
  [101, 'Md', '멘델레븀', 'Mendelevium', 258, C.actinide, S.s, '주기율표를 만든 멘델레예프의 이름을 땄다.'],
  [102, 'No', '노벨륨', 'Nobelium', 259, C.actinide, S.s, '노벨의 이름을 딴 인공 원소다.'],
  [103, 'Lr', '로렌슘', 'Lawrencium', 266, C.actinide, S.s, '악티늄족의 마지막 원소다.'],
  [104, 'Rf', '러더포듐', 'Rutherfordium', 267, C.transition, S.s, '원자핵을 발견한 러더퍼드의 이름을 땄다.'],
  [105, 'Db', '더브늄', 'Dubnium', 268, C.transition, S.s, '러시아 두브나 연구소의 이름을 땄다.'],
  [106, 'Sg', '시보귬', 'Seaborgium', 269, C.transition, S.s, '초우라늄 원소를 여럿 만든 시보그의 이름을 땄다.'],
  [107, 'Bh', '보륨', 'Bohrium', 270, C.transition, S.s, '원자 모형의 보어에서 이름을 땄다.'],
  [108, 'Hs', '하슘', 'Hassium', 269, C.transition, S.s, '독일 헤센 주의 라틴어 이름에서 땄다.'],
  [109, 'Mt', '마이트너륨', 'Meitnerium', 278, C.transition, S.s, '핵분열을 밝힌 마이트너의 이름을 땄다.'],
  [110, 'Ds', '다름슈타튬', 'Darmstadtium', 281, C.transition, S.s, '독일 다름슈타트에서 처음 만들어졌다.'],
  [111, 'Rg', '뢴트게늄', 'Roentgenium', 282, C.transition, S.s, 'X선을 발견한 뢴트겐의 이름을 땄다.'],
  [112, 'Cn', '코페르니슘', 'Copernicium', 285, C.transition, S.s, '천문학자 코페르니쿠스의 이름을 땄다.'],
  [113, 'Nh', '니호늄', 'Nihonium', 286, C.post, S.s, '일본에서 처음 만들어진 원소다.'],
  [114, 'Fl', '플레로븀', 'Flerovium', 289, C.post, S.s, '러시아 플료로프 연구소의 이름을 땄다.'],
  [115, 'Mc', '모스코븀', 'Moscovium', 290, C.post, S.s, '모스크바 지역의 이름을 땄다.'],
  [116, 'Lv', '리버모륨', 'Livermorium', 293, C.post, S.s, '미국 리버모어 연구소의 이름을 땄다.'],
  [117, 'Ts', '테네신', 'Tennessine', 294, C.halogen, S.s, '미국 테네시 주의 이름을 땄다.'],
  [118, 'Og', '오가네손', 'Oganesson', 294, C.noble, S.s, '현재까지 알려진 마지막 원소다.'],
]

/* ------------------------------------------------------------------ *
 * 2. 전자배치 계산
 * ------------------------------------------------------------------ */
// 마델룽 규칙에 따른 오비탈 채움 순서
const ORDER = [
  [1, 's'], [2, 's'], [2, 'p'], [3, 's'], [3, 'p'], [4, 's'], [3, 'd'], [4, 'p'],
  [5, 's'], [4, 'd'], [5, 'p'], [6, 's'], [4, 'f'], [5, 'd'], [6, 'p'], [7, 's'],
  [5, 'f'], [6, 'd'], [7, 'p'],
]
const CAP = { s: 2, p: 6, d: 10, f: 14 }

// 바닥상태가 아우프바우와 다른 원소들 (부껍질 → 전자 수 덮어쓰기)
const EXCEPTIONS = {
  24: { '4s': 1, '3d': 5 },   // Cr
  29: { '4s': 1, '3d': 10 },  // Cu
  41: { '5s': 1, '4d': 4 },   // Nb
  42: { '5s': 1, '4d': 5 },   // Mo
  44: { '5s': 1, '4d': 7 },   // Ru
  45: { '5s': 1, '4d': 8 },   // Rh
  46: { '5s': 0, '4d': 10 },  // Pd
  47: { '5s': 1, '4d': 10 },  // Ag
  57: { '4f': 0, '5d': 1 },   // La
  58: { '4f': 1, '5d': 1 },   // Ce
  64: { '4f': 7, '5d': 1 },   // Gd
  78: { '5d': 9, '6s': 1 },   // Pt
  79: { '5d': 10, '6s': 1 },  // Au
  89: { '5f': 0, '6d': 1 },   // Ac
  90: { '5f': 0, '6d': 2 },   // Th
  91: { '5f': 2, '6d': 1 },   // Pa
  92: { '5f': 3, '6d': 1 },   // U
  93: { '5f': 4, '6d': 1 },   // Np
  96: { '5f': 7, '6d': 1 },   // Cm
  103: { '5f': 14, '6d': 0, '7p': 1 }, // Lr
}

function buildConfig(z) {
  /** @type {{n:number,l:string,count:number}[]} */
  const shells = []
  let left = z
  for (const [n, l] of ORDER) {
    if (left <= 0) break
    const count = Math.min(CAP[l], left)
    shells.push({ n, l, count })
    left -= count
  }
  const ex = EXCEPTIONS[z]
  if (ex) {
    for (const [key, count] of Object.entries(ex)) {
      const n = Number(key[0])
      const l = key[1]
      const found = shells.find((s) => s.n === n && s.l === l)
      if (found) found.count = count
      else shells.push({ n, l, count })
    }
  }
  const filtered = shells.filter((s) => s.count > 0)
  // 표기는 주양자수 → 부껍질 순으로 정렬한다
  filtered.sort((a, b) => (a.n - b.n) || ('spdf'.indexOf(a.l) - 'spdf'.indexOf(b.l)))
  const total = filtered.reduce((sum, s) => sum + s.count, 0)
  if (total !== z) {
    throw new Error(`전자 수 불일치: Z=${z}, 계산=${total}`)
  }
  return filtered
}

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
const sup = (n) => String(n).split('').map((d) => SUP[d]).join('')

function configToString(shells) {
  return shells.map((s) => `${s.n}${s.l}${sup(s.count)}`).join(' ')
}

function toBohrShells(shells) {
  /** @type {number[]} */
  const byN = []
  for (const s of shells) {
    byN[s.n - 1] = (byN[s.n - 1] ?? 0) + s.count
  }
  return Array.from(byN, (v) => v ?? 0).filter((v, i, arr) => v > 0 || arr.slice(i).some((x) => x > 0))
}

/* ------------------------------------------------------------------ *
 * 3. 주기 / 족 / 좌표
 * ------------------------------------------------------------------ */
function layout(z) {
  if (z === 1) return { period: 1, group: 1, row: 1, col: 1 }
  if (z === 2) return { period: 1, group: 18, row: 1, col: 18 }
  if (z <= 10) return { period: 2, group: z <= 4 ? z - 2 : z + 8, row: 2, col: z <= 4 ? z - 2 : z + 8 }
  if (z <= 18) return { period: 3, group: z <= 12 ? z - 10 : z, row: 3, col: z <= 12 ? z - 10 : z }
  if (z <= 36) return { period: 4, group: z - 18, row: 4, col: z - 18 }
  if (z <= 54) return { period: 5, group: z - 36, row: 5, col: z - 36 }
  if (z <= 56) return { period: 6, group: z - 54, row: 6, col: z - 54 }
  if (z <= 71) return { period: 6, group: null, row: 9, col: z - 57 + 3 }
  if (z <= 86) return { period: 6, group: z - 68, row: 6, col: z - 68 }
  if (z <= 88) return { period: 7, group: z - 86, row: 7, col: z - 86 }
  if (z <= 103) return { period: 7, group: null, row: 10, col: z - 89 + 3 }
  return { period: 7, group: z - 100, row: 7, col: z - 100 }
}

/* ------------------------------------------------------------------ *
 * 4. 조립
 * ------------------------------------------------------------------ */
const elements = TABLE.map(([number, symbol, name, nameEn, mass, category, state, description, aliases]) => {
  const config = buildConfig(number)
  const { period, group, row, col } = layout(number)
  return {
    number,
    symbol,
    name,
    nameEn,
    aliases: aliases ?? [],
    mass,
    category,
    state,
    period,
    group,
    row,
    col,
    electronConfig: configToString(config),
    subshells: config.map((s) => ({ shell: s.n, orbital: s.l, electrons: s.count })),
    shells: toBohrShells(config),
    description,
  }
})

/* 검증 */
if (elements.length !== 118) throw new Error(`원소 개수 오류: ${elements.length}`)
elements.forEach((el, i) => {
  if (el.number !== i + 1) throw new Error(`번호 순서 오류: ${el.number}`)
  const sum = el.shells.reduce((a, b) => a + b, 0)
  if (sum !== el.number) throw new Error(`${el.symbol} 껍질 전자 합 오류: ${sum} != ${el.number}`)
  if (el.shells.some((v) => v <= 0)) throw new Error(`${el.symbol} 빈 껍질 포함`)
})
const symbols = new Set(elements.map((e) => e.symbol))
if (symbols.size !== 118) throw new Error('중복 기호 존재')
const names = new Set(elements.map((e) => e.name))
if (names.size !== 118) throw new Error('중복 이름 존재')

const out = resolve(__dirname, '../src/data/elements.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(elements, null, 2) + '\n', 'utf8')

console.log(`✅ ${elements.length}개 원소 저장 → ${out}`)
console.log('   예시 Na:', JSON.stringify(elements[10].shells), elements[10].electronConfig)
console.log('   예시 Fe:', JSON.stringify(elements[25].shells), elements[25].electronConfig)
console.log('   예시 U :', JSON.stringify(elements[91].shells), elements[91].electronConfig)
