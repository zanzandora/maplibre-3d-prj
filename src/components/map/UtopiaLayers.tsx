import { Source, Layer } from 'react-map-gl/maplibre';
import type {
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
  FillExtrusionLayerSpecification,
  CircleLayerSpecification,
} from 'maplibre-gl';
import { API_BASE_URL } from '../../utils/constants';

interface UtopiaLayersProps {
  show3D: boolean;
}

/**
 * UtopiaLayers: Manages all vector tile layers from the 'utopia' source.
 * Visibility is toggled based on the show3D prop.
 */
export const UtopiaLayers = ({ show3D }: UtopiaLayersProps) => {
  const visibility2D = show3D ? 'none' : 'visible';

  // --- Layer Definitions ---

  const waterWay: LineLayerSpecification = {
    id: 'water-way',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.waterway',
    minzoom: 12,
    filter: ['all', ['!=', 'class', 'ocean']],
    paint: { 'line-color': 'rgb(146,199,230)' },
    layout: { visibility: 'visible' },
  };

  const waterPolygon: FillLayerSpecification = {
    id: 'water-polygon',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.water',
    minzoom: 12,
    maxzoom: 24,
    layout: { visibility: 'visible' },
    paint: { 'fill-color': 'rgb(146,199,230)' },
  };

  const waterWayName: SymbolLayerSpecification = {
    id: 'waterway-name-river-ctm',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.waterway',
    minzoom: 12,
    filter: ['all', ['==', 'class', 'river']],
    layout: {
      'text-max-width': 8,
      'symbol-placement': 'line',
      'text-field': '{name}',
      'text-font': ['Noto Sans Regular'],
      'text-letter-spacing': 0.1,
      'text-size': {
        stops: [
          [12, 11],
          [18, 16],
          [20, 20],
        ],
      },
      visibility: visibility2D,
    },
    paint: {
      'text-color': 'rgba(0, 90, 129, 1)',
      'text-halo-color': 'rgb(255, 255, 255)',
      'text-halo-width': 1,
      'text-halo-blur': 1,
    },
  };

  const roadPolygon: FillLayerSpecification = {
    id: 'road-polygon-road',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.road_polygon',
    minzoom: 12,
    filter: [
      'all',
      ['!in', 'class', 'traffic island', 'separator', 'roadside', 'pavement'],
      ['!in', 'brunnel', 'tunnel', 'bridge'],
    ],
    layout: { visibility: 'visible' },
    paint: { 'fill-color': 'rgba(255, 255, 255, 1)' },
  };

  const roadPolygonPavement: FillLayerSpecification = {
    id: 'road-polygon-pavement-copy',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.road_polygon',
    minzoom: 12,
    maxzoom: 22,
    filter: ['all', ['==', 'class', 'pavement']],
    layout: { visibility: 'visible' },
    paint: {
      'fill-color': {
        stops: [
          [15, 'rgba(255, 255, 255, 1)'],
          [17, 'rgb(216,216,216)'],
        ],
      },
      'fill-opacity': 1,
    },
  };

  const roadBoundary: LineLayerSpecification = {
    id: 'road_boundary',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.roadboundary',
    minzoom: 12,
    layout: {
      'line-cap': 'round',
      visibility: 'visible',
    },
    paint: {
      'line-color': 'rgba(201, 201, 201, 1)',
      'line-width': {
        base: 1.3,
        stops: [
          [15, 0.5],
          [20, 2],
        ],
      },
      'line-opacity': {
        stops: [
          [15, 0.3],
          [16, 1],
        ],
      },
    },
  };

  const roadService: LineLayerSpecification = {
    id: 'road-ctm-service',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.road_line',
    filter: [
      'all',
      ['==', '$type', 'LineString'],
      ['!=', 'brunnel', 'tunnel'],
      ['in', 'class', 'service', 'track', 'residential'],
      ['==', 'name_en', '1'],
    ],
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
      visibility: 'visible',
    },
    paint: {
      'line-color': 'rgb(255, 255, 255)',
      'line-width': {
        stops: [
          [13, 1],
          [14, 2],
          [15, 5],
          [16, 8],
          [17, 16],
          [18, 23],
          [19, 40],
          [20, 50],
        ],
      },
    },
  };

  const roadTrunk: LineLayerSpecification = {
    id: 'road-ctm-trunk',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.road_line',
    filter: [
      'all',
      ['==', '$type', 'LineString'],
      ['!in', 'brunnel', 'bridge', 'tunnel'],
      ['in', 'class', 'trunk'],
      ['==', 'name_en', '1'],
    ],
    layout: {
      'line-join': 'round',
      visibility: 'visible',
      'line-round-limit': 1.05,
    },
    paint: {
      'line-color': 'rgb(255, 227, 171)',
      'line-width': {
        stops: [
          [5, 0.1],
          [7, 1],
          [8, 1],
          [9, 1],
          [10, 1.5],
          [11, 1.5],
          [12, 2],
          [13, 2],
          [14, 2.5],
          [15, 7.5],
          [16, 16],
          [17, 29],
          [18, 40],
          [19, 60],
          [20, 75],
        ],
      },
    },
  };

  const waterName: SymbolLayerSpecification = {
    id: 'water-name-ctm',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.water_name',
    minzoom: 12,
    layout: {
      'text-max-width': 8,
      'symbol-placement': 'point',
      'text-field': '{name}',
      'text-font': ['Noto Sans Regular'],
      'text-letter-spacing': 0.1,
      'text-size': {
        stops: [
          [12, 11],
          [18, 16],
          [20, 20],
        ],
      },
      visibility: visibility2D,
    },
    paint: {
      'text-color': 'rgba(0, 90, 129, 1)',
      'text-halo-color': 'rgb(255, 255, 255)',
      'text-halo-width': 1,
      'text-halo-blur': 1,
    },
  };

  const roadPolygonBridge: FillLayerSpecification = {
    id: 'road-polygon-bridge',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.road_polygon',
    minzoom: 12,
    filter: [
      'all',
      ['!in', 'class', 'traffic island', 'separator', 'roadside', 'pavement'],
      ['in', 'brunnel', 'bridge'],
    ],
    layout: { visibility: 'visible' },
    paint: { 'fill-color': 'rgba(255, 246, 220, 1)' },
  };

  const ranhGioi: FillLayerSpecification = {
    id: 'ranhgioi',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.RGQH_RanhGioiQuyHoach_A',
    layout: { visibility: 'visible' },
    paint: { 'fill-color': 'rgba(149, 199, 164, 1)' },
  };

  const canhQuanA: FillLayerSpecification = {
    id: 'canhquan-a',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.KTCQ_KhongGianKTCQ_A',
    paint: {
      'fill-pattern': [
        'match',
        ['get', 'phanloai'],
        'Đất cây xanh',
        'a_Co5',
        'Đất cây xanh cách ly',
        'a_Co4',
        'Đất cây xanh đơn vị ở',
        'a_Co1',
        'Đất cây xanh hạn chế',
        'a_Co3',
        'Đất cây xanh TDTT',
        'a_Co2',
        '',
      ],
    },
    layout: { visibility: 'visible' },
  };

  const canhQuanNuocMat: FillLayerSpecification = {
    id: 'canhquan-nuocmat',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.KTCQ_KhongGianKTCQ_A',
    filter: ['==', 'phanloai', 'Mặt nước'],
    paint: { 'fill-color': 'rgb(146,199,230)' },
    layout: { visibility: 'visible' },
  };

  const viaHe: FillExtrusionLayerSpecification = {
    id: 'viahe',
    type: 'fill-extrusion',
    source: 'utopia',
    'source-layer': 'utopia.matduong',
    filter: ['==', 'class', 'Vỉa hè'],
    paint: {
      'fill-extrusion-color': '#dfdcdc',
      'fill-extrusion-height': 0.3,
      'fill-extrusion-opacity': 0.9,
      'fill-extrusion-base': 0,
    },
    layout: { visibility: 'visible' },
  };

  const longDuong: FillLayerSpecification = {
    id: 'longduong',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.matduong',
    filter: ['==', 'class', 'Lòng đường'],
    paint: {
      'fill-color': '#7E858F',
      'fill-outline-color': '#edf0f3',
    },
    layout: { visibility: 'visible' },
  };

  const congTrinh: FillExtrusionLayerSpecification = {
    id: 'congtrinh',
    type: 'fill-extrusion',
    source: 'utopia',
    'source-layer': 'utopia.congtrinh',
    filter: ['!in', 'name', 'Cổng trường'],
    paint: {
      'fill-extrusion-opacity': 1,
      'fill-extrusion-base': 0,
      'fill-extrusion-height': 0.5,
      'fill-extrusion-color': '#013E7C',
    },
    layout: { visibility: visibility2D },
  };

  const congTrinhA: FillLayerSpecification = {
    id: 'congtrinh-a',
    type: 'fill',
    source: 'utopia',
    'source-layer': 'utopia.KTCQ_CongTrinh_A',
    filter: [
      'in',
      'ten',
      'Bãi đỗ xe',
      'Đường nội bộ',
      'Khu dịch vụ công cộng',
      'Sân biệt thự',
      'Sân khu nhà phố thương mại',
    ],
    paint: {
      'fill-color': [
        'match',
        ['get', 'ten'],
        'Bãi đỗ xe',
        '#cfcfcf',
        'Đường nội bộ',
        '#4B3901',
        'Khu dịch vụ công cộng',
        '#FFDF7F',
        'Sân biệt thự',
        '#656565',
        'Sân khu nhà phố thương mại',
        '#656565',
        '#7FFF00',
      ],
    },
    layout: { visibility: 'visible' },
  };

  const congTrinhLine: LineLayerSpecification = {
    id: 'congtrinh_line',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.congtrinh_line',
    paint: {
      'line-color': '#fff',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        17,
        0.1,
        18,
        0.5,
        20,
        1,
      ],
    },
    layout: { visibility: 'visible' },
  };

  const landmarkCircle: CircleLayerSpecification = {
    id: 'landmark_circle',
    type: 'circle',
    source: 'utopia',
    'source-layer': 'utopia.routing_junctions',
    minzoom: 17,
    filter: [
      'any',
      ['==', ['get', 'item'], 'Biệt thự'],
      ['==', ['get', 'item'], 'Nhà phố thương mại'],
      ['==', ['get', 'item'], 'Dinh thự'],
    ],
    layout: { visibility: visibility2D },
    paint: {
      'circle-radius': 3,
      'circle-color': '#ff0000',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
    },
  };

  const landmarkLabel: SymbolLayerSpecification = {
    id: 'landmark_label',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.routing_junctions',
    minzoom: 15,
    layout: {
      'icon-image': [
        'match',
        ['get', 'name'],
        'Bể bơi chủ đề Zen Casade',
        'KDL_BeBoi',
        'Bể bơi lười Azure Oasis Pool',
        'KDL_BeBoiTrongNha',
        'Bến thuyền',
        'KDL_benthuyen1',
        'Cầu Harmony Crossing',
        'KDL_cau',
        'Club House Utopia Club Haven',
        'a_Drink',
        'Cổng chính',
        'Utopia1',
        'Công viên thác nước The Falls',
        'KDL_Vuon_DarkGreen',
        'Công viên trung tâm',
        'a_DaiPhunNuoc_1',
        'Vườn chuyên đề',
        'KDL_Vuon_DarkGreen',
        'Vườn nhật Utopia Zen Garden',
        'KDL_Vuon_DarkGreen',
        'Vườn ươm công nghệ cao Utopia Bloom',
        'KDL_Vuon_DarkGreen',
        'Công viên Utopia Flower Garden',
        'KDL_Vuon_Green',
        'Công viên Yoga Tranquil Flow',
        'a_Yoga2',
        "Đồi check - in Dreamer's Peak",
        'KDL_doicheckin',
        'Trung tâm CSSK & sắc đẹp Utopia Onsen & Wellness',
        'KDL_Onsen',
        'Khách sạn Utopia Hotel & Resort',
        'Utopia1',
        'Trung tâm hội nghị Utopia Grand Center',
        'sb_phonghop',
        'Trạm cấp nước',
        'sbdn_nuoc_nhat1',
        'Khu du lịch sinh thái',
        'KDL_BaiBien',
        'Nhà hàng Buffet',
        'sb_nhahang',
        'Nhà hàng chuyên đề Fusia Restaurant',
        'sb_nhahang',
        'Nhà hàng Fine Dining',
        'sb_nhahang',
        'Moon lake Bungalows',
        'KDL_Camping',
        'Trường mầm non',
        'a_TruongHoc3',
        'Trường tiểu học',
        'a_TruongHoc4',
        'Bãi đỗ ô tô',
        'a_baidoxe_Blue',
        'Sales Gallery LightriX Center',
        'Utopia1',
        'Trạm xử lý nước thải',
        'NhaMyNuocThai',
        '',
      ],
      'icon-size': ['step', ['zoom'], 0, 15, 0.3, 17, 0.5, 19, 0.7, 20, 1],
      'icon-pitch-alignment': 'viewport',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'text-field': '{name}',
      'text-size': [
        'step',
        ['zoom'],
        0,
        18,
        14,
        19,
        16,
        20,
        18,
        21,
        20,
        22,
        22,
        23,
        24,
        24,
        26,
      ],
      'text-font': ['Inter Regular'],
      'text-offset': [0, 0.5],
      'text-anchor': 'top',
      'text-optional': true,
      visibility: visibility2D,
    },
    paint: {
      'text-color': '#1b1b1b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
    },
  };

  const treeLayer: SymbolLayerSpecification = {
    id: 'tree-layer',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.KTCQ_CayXanh_P',
    minzoom: 15,
    maxzoom: 22,
    layout: {
      'icon-image': '0_Tree_4',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        16,
        0.05,
        17,
        0.1,
        18,
        0.15,
        19,
        0.2,
        20,
        0.3,
        21,
        0.4,
        22,
        0.5,
      ],
      'icon-pitch-alignment': 'viewport',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'symbol-placement': 'point',
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  const poiOutdoor: SymbolLayerSpecification = {
    id: 'poi_outdoor',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.routing_junctions',
    minzoom: 16,
    filter: [
      'any',
      ['==', ['get', 'type'], 'Poi'],
      ['==', ['get', 'type'], 'poi'],
      ['==', ['get', 'type'], 'POI'],
    ],
    layout: {
      'icon-image': [
        'step',
        ['zoom'],
        [
          'case',
          ['==', ['get', 'name'], 'Điểm dừng xe bus Đại học Luật'],
          'a_bus_ BlackYellow',
          [
            'match',
            ['get', 'category'],
            'Cổng trường',
            'a_Cong',
            'Cửa ra vào',
            'a_loivao_cua',
            '',
          ],
        ],
        17,
        [
          'case',
          ['==', ['get', 'name'], 'Điểm dừng xe bus Đại học Luật'],
          'a_bus_ BlackYellow',
          [
            'match',
            ['get', 'category'],
            'Cổng trường',
            'a_Cong',
            'Bãi xe',
            'a_baidoxe_Blue',
            'Thư viện',
            'a_giaoduc_thuvien',
            'Ăn uống',
            'a_AnUong',
            'Cửa ra vào',
            'a_loivao_cua',
            '',
          ],
        ],
        18,
        [
          'case',
          ['==', ['get', 'name'], 'Điểm dừng xe bus Đại học Luật'],
          'a_bus_Blue',
          [
            'match',
            ['get', 'category'],
            'Cổng trường',
            'a_Cong',
            'Phòng bảo vệ',
            'a_BaoVe2',
            'Bãi xe',
            'a_baidoxe_Blue',
            'Thư viện',
            'a_giaoduc_thuvien',
            'Ăn uống',
            'a_AnUong',
            'Cửa ra vào',
            'a_loivao_cua',
            '',
          ],
        ],
        19,
        [
          'case',
          ['==', ['get', 'name'], 'Điểm dừng xe bus Đại học Luật'],
          'a_bus_Blue',
          [
            'match',
            ['get', 'category'],
            'Cổng trường',
            'a_Cong',
            'Phòng bảo vệ',
            'a_BaoVe2',
            'Bãi xe',
            'a_baidoxe_Blue',
            'Thư viện',
            'a_giaoduc_thuvien',
            'Ăn uống',
            'a_AnUong',
            'Cửa ra vào',
            'a_loivao_cua',
            '',
          ],
        ],
      ],
      'icon-size': ['match', ['get', 'category'], 'Cổng', 0.75, 0.6],
      'icon-pitch-alignment': 'viewport',
      'text-field': '{name}',
      'icon-anchor': 'bottom',
      'symbol-placement': 'point',
      'text-size': ['step', ['zoom'], 0, 17, 12, 18, 13, 19, 14, 20, 15],
      'text-font': ['Inter Regular'],
      'text-offset': [0, 0.5],
      'text-anchor': 'center',
      'text-optional': true,
      visibility: visibility2D,
    },
    paint: {
      'text-color': '#0d0492',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
    },
  };

  const lightingCableDiemsang: SymbolLayerSpecification = {
    id: 'lighting_cable_diemsang',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.QHCD_CongTrinhChieuSang_P',
    minzoom: 19,
    layout: {
      'icon-image': [
        'match',
        ['get', 'phanloai'],
        'Đèn một phía',
        '0_CotDen_01Bong_4',
        'Tủ điện chiếu sáng',
        'tuchieusang1',
        '',
      ],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.3,
        19,
        0.4,
        20,
        0.5,
        21,
        0.6,
      ],
      'icon-pitch-alignment': 'viewport',
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  const thongTinLienLac: LineLayerSpecification = {
    id: 'thontinlienlac',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.TTLL_MangLuoiCapThongTin_L',
    minzoom: 19,
    paint: {
      'line-color': 'rgba(30, 30, 32, 1)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 17, 1, 18, 2, 20, 3],
      'line-dasharray': [1, 1, 1],
    },
    layout: { visibility: 'visible' },
  };

  const thongTinLienLacTucap: SymbolLayerSpecification = {
    id: 'thontinlienlac_tucap',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.TTLL_CongTrinhThongTin_P',
    minzoom: 19,
    layout: {
      'icon-image': 'tucapvienthong',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.3,
        19,
        0.4,
        20,
        0.5,
        21,
        0.6,
      ],
      visibility: 'visible',
    },
  };

  const capNuoc: LineLayerSpecification = {
    id: 'capnuoc',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.QHCN_MangLuoiCapNuoc_L',
    minzoom: 19,
    paint: {
      'line-color': 'rgba(93, 70, 227, 1)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 17, 1, 18, 2, 20, 3],
    },
    layout: { visibility: 'visible' },
  };

  const capNuocLabel: SymbolLayerSpecification = {
    id: 'capnuoc_label',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.QHCN_MangLuoiCapNuoc_L',
    minzoom: 20,
    paint: {
      'text-color': 'rgba(93, 70, 227, 1)',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
      'text-halo-blur': 1,
    },
    layout: {
      visibility: visibility2D,
      'symbol-placement': 'line',
      'symbol-avoid-edges': true,
      'text-field': '{duongkinh} - {chieudai}',
      'text-rotation-alignment': 'map',
      'text-keep-upright': true,
      'text-font': ['Noto Sans Regular'],
      'text-size': {
        stops: [
          [0, 8],
          [10, 9],
          [14, 11],
          [15, 12],
          [18, 14],
          [20, 20],
        ],
      },
      'text-offset': [5, 0],
    },
  };

  const thoatNuocMua: LineLayerSpecification = {
    id: 'thoatnuocmua',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.CBKT_MangLuoiThoatNuocMua_L',
    minzoom: 19,
    paint: {
      'line-color': 'rgba(93, 70, 227, 1)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 17, 1, 18, 2, 20, 3],
      'line-dasharray': [3, 1, 3],
    },
    layout: { visibility: 'visible' },
  };

  const thoatNuocMuaLabel: SymbolLayerSpecification = {
    id: 'thoatnuocmua_label',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.CBKT_MangLuoiThoatNuocMua_L',
    minzoom: 20,
    paint: {
      'text-color': 'rgba(93, 70, 227, 1)',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
      'text-halo-blur': 1,
    },
    layout: {
      visibility: visibility2D,
      'symbol-placement': 'line',
      'symbol-avoid-edges': true,
      'text-field': '{chieudai} - {chieurong} - {chieucao}',
      'text-rotation-alignment': 'map',
      'text-keep-upright': true,
      'text-font': ['Noto Sans Regular'],
      'text-size': {
        stops: [
          [0, 8],
          [10, 9],
          [14, 11],
          [15, 12],
          [18, 14],
          [20, 20],
        ],
      },
      'text-offset': [5, 0],
    },
  };

  const thoatNuocThai: LineLayerSpecification = {
    id: 'thoatnuocthai',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.TNT_MangLuoiThoatNuocThai_L',
    minzoom: 19,
    paint: {
      'line-color': 'rgba(44, 38, 81, 1)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 17, 1, 18, 2, 20, 3],
      'line-dasharray': [2, 2, 2],
    },
    layout: { visibility: 'visible' },
  };

  const thoatNuocThaiLabel: SymbolLayerSpecification = {
    id: 'thoatnuocthai_label',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.TNT_MangLuoiThoatNuocThai_L',
    minzoom: 20,
    paint: {
      'text-color': 'rgba(44, 38, 81, 1)',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
      'text-halo-blur': 1,
    },
    layout: {
      visibility: visibility2D,
      'symbol-placement': 'line',
      'symbol-avoid-edges': true,
      'text-field': '{duongkinh} - {chieudai}',
      'text-rotation-alignment': 'map',
      'text-keep-upright': true,
      'text-font': ['Noto Sans Regular'],
      'text-size': {
        stops: [
          [0, 8],
          [10, 9],
          [14, 11],
          [15, 12],
          [18, 14],
          [20, 20],
        ],
      },
      'text-offset': [5, 0],
    },
  };

  const electricCable: LineLayerSpecification = {
    id: 'electric_cable',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.QHCD_MangLuoiPhanPhoiDien_L',
    minzoom: 19,
    paint: {
      'line-color': '#a80a0a',
      'line-width': ['interpolate', ['linear'], ['zoom'], 17, 1, 18, 2, 20, 3],
      'line-dasharray': [2, 1, 2],
    },
    layout: { visibility: 'visible' },
  };

  const electricCableLabel: SymbolLayerSpecification = {
    id: 'electric_cable_label',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.QHCD_MangLuoiPhanPhoiDien_L',
    minzoom: 20,
    paint: {
      'text-color': '#ff2200',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
      'text-halo-blur': 2,
    },
    layout: {
      visibility: visibility2D,
      'symbol-placement': 'line',
      'symbol-avoid-edges': true,
      'text-field': '{dienthe} kV',
      'text-rotation-alignment': 'map',
      'text-keep-upright': true,
      'text-font': ['Noto Sans Regular'],
      'text-size': {
        stops: [
          [0, 8],
          [10, 9],
          [14, 11],
          [15, 12],
          [18, 14],
          [20, 20],
        ],
      },
      'text-offset': [5, 0],
    },
  };

  const lightingCable: LineLayerSpecification = {
    id: 'lighting_cable',
    type: 'line',
    source: 'utopia',
    'source-layer': 'utopia.QHCD_MangLuoiChieuSang_L',
    minzoom: 19,
    paint: {
      'line-color': 'rgba(127, 239, 75, 1)',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        17,
        0.5,
        18,
        1,
        20,
        2,
      ],
      'line-dasharray': [2, 1, 2],
    },
    layout: { visibility: 'visible' },
  };

  const diemQuanTrac: SymbolLayerSpecification = {
    id: 'diemquantrac',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.BVMT_DiemQuanTrac_P',
    minzoom: 18,
    layout: {
      'icon-image': 'tramquantrac',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.6,
        19,
        0.8,
        20,
        1,
        21,
        1.5,
      ],
      'icon-pitch-alignment': 'viewport',
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  const electricCablePoint: SymbolLayerSpecification = {
    id: 'electric_cable_point',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.QHCD_CongTrinhCapDien_P',
    minzoom: 19,
    layout: {
      'icon-image': [
        'match',
        ['get', 'phanloai'],
        'Trạm 35(22)/0.4KV',
        'TBA2',
        'Tủ điện',
        'tudien2',
        '',
      ],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.3,
        19,
        0.4,
        20,
        0.5,
        21,
        0.6,
      ],
      'icon-pitch-alignment': 'viewport',
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  const pcccP: SymbolLayerSpecification = {
    id: 'pccc_p',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.QHCN_CongTrinhCapNuocPCCC_P',
    minzoom: 19,
    layout: {
      'icon-image': [
        'match',
        ['get', 'phanloai'],
        'Hố van',
        'hovancapcuoc',
        'Trụ cứu hỏa',
        'trucuuhoa',
        '',
      ],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.3,
        19,
        0.4,
        20,
        0.5,
        21,
        0.6,
      ],
      'icon-pitch-alignment': 'viewport',
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  const thoatNuocMuaPoint: SymbolLayerSpecification = {
    id: 'thoatnuocmua_point',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.CBKT_CongTrinhCBKT_P',
    minzoom: 19,
    layout: {
      'icon-image': [
        'match',
        ['get', 'phanloai'],
        'Cửa xả',
        'BomNuocThai',
        'Hố ga thăm',
        'hogatham',
        '',
      ],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.2,
        19,
        0.3,
        20,
        0.4,
        21,
        0.5,
      ],
      'icon-pitch-alignment': 'map',
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  const thoatNuocThaiTnt: SymbolLayerSpecification = {
    id: 'thoatnuocthai_tnt',
    type: 'symbol',
    source: 'utopia',
    'source-layer': 'utopia.TNT_CongTrinhTNTvaVSMT_P',
    minzoom: 19,
    layout: {
      'icon-image': [
        'match',
        ['get', 'phanloai'],
        'Hố ga',
        'manhole',
        'Trạm bơm nước thải',
        'NhaMyNuocThai',
        'Trạm xử lý nước thải',
        'NhaMyNuocThai',
        'Điểm tập trung CTR',
        'bairac2',
        '',
      ],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        18,
        0.3,
        19,
        0.4,
        20,
        0.5,
        21,
        0.6,
      ],
      'icon-pitch-alignment': 'map',
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-optional': false,
      'icon-anchor': 'bottom',
      visibility: 'visible',
    },
  };

  return (
    <Source
      id='utopia'
      type='vector'
      tiles={[`${API_BASE_URL}/vts/utopia/{z}/{x}/{y}`]}
      maxzoom={18}
    >
      <Layer {...waterWay} />
      <Layer {...waterPolygon} />
      <Layer {...waterWayName} />
      <Layer {...roadPolygon} />
      <Layer {...roadPolygonPavement} />
      <Layer {...roadBoundary} />
      <Layer {...roadService} />
      <Layer {...roadTrunk} />
      <Layer {...waterName} />
      <Layer {...roadPolygonBridge} />
      <Layer {...ranhGioi} />
      <Layer {...canhQuanA} />
      <Layer {...canhQuanNuocMat} />
      <Layer {...viaHe} />
      <Layer {...longDuong} />
      <Layer {...congTrinh} />
      <Layer {...congTrinhA} />
      <Layer {...congTrinhLine} />
      <Layer {...landmarkCircle} />
      <Layer {...landmarkLabel} />
      <Layer {...treeLayer} />
      <Layer {...poiOutdoor} />
      <Layer {...lightingCableDiemsang} />
      <Layer {...thongTinLienLac} />
      <Layer {...thongTinLienLacTucap} />
      <Layer {...capNuoc} />
      <Layer {...capNuocLabel} />
      <Layer {...thoatNuocMua} />
      <Layer {...thoatNuocMuaLabel} />
      <Layer {...thoatNuocThai} />
      <Layer {...thoatNuocThaiLabel} />
      <Layer {...electricCable} />
      <Layer {...electricCableLabel} />
      <Layer {...lightingCable} />
      <Layer {...diemQuanTrac} />
      <Layer {...electricCablePoint} />
      <Layer {...pcccP} />
      <Layer {...thoatNuocMuaPoint} />
      <Layer {...thoatNuocThaiTnt} />
    </Source>
  );
};
