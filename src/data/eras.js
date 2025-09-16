export const ERAS = [
  { id: '1956', name: '1956: ダートマス会議', threshold: 0 },
  { id: '1958', name: '1958–1969: パーセプトロン/記号主義', threshold: 500 },
  { id: '1960s', name: '1960s: 記号推論', threshold: 5000 },
  { id: '2006', name: '2006–2011: DL再興・GPU', threshold: 200000 },
  { id: '2012', name: '2012: AlexNet', threshold: 2500000 },
  { id: '2017', name: '2017: Transformer', threshold: 50000000 },
  { id: '2018', name: '2018–2020: 事前学習時代', threshold: 2.5e8 },
  { id: '2021', name: '2021–2025: 生成AI大流行', threshold: 1e10 },
];

export function eraIndexById(id) {
  return ERAS.findIndex((e) => e.id === id);
}

export function nextEra(currentId) {
  const i = eraIndexById(currentId);
  return ERAS[i + 1] || null;
}

export function isEraAOrEarlierThanB(a, b){
  return eraIndexById(a) <= eraIndexById(b);
}

