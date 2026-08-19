/* eslint-disable @typescript-eslint/no-explicit-any */
import { Source, Layer } from 'react-map-gl/maplibre';
import type {
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
  FillExtrusionLayerSpecification,
} from 'maplibre-gl';

interface IvoryLayersProps {
  show3D: boolean;
}

/**
 * IvoryLayers: Manages all vector tile layers from the 'ivory' source.
 * Visibility is toggled based on the show3D prop.
 */
export const IvoryLayers = ({ show3D }: IvoryLayersProps) => {
  const visibility2D = show3D ? 'none' : 'visible';

  // --- Layer Definitions ---

  const waterWay: LineLayerSpecification = {
    id: 'water-way',
    type: 'line',
    source: 'ivory',
    'source-layer': 'ivory.waterway',
    minzoom: 12,
    filter: ['all', ['!=', 'class', 'ocean']],
    paint: { 'line-color': 'rgb(146,199,230)' },
    layout: { visibility: 'visible' },
  };

  const waterPolygon: FillLayerSpecification = {
    id: 'water-polygon',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.water',
    minzoom: 12,
    maxzoom: 24,
    layout: { visibility: 'visible' },
    paint: { 'fill-color': 'rgb(146,199,230)' },
  };

  const waterWayName: any = {
    id: 'waterway-name-river-ctm',
    type: 'symbol',
    source: 'ivory',
    'source-layer': 'ivory.waterway',
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

  const roadService: any = {
    id: 'road-ctm-service',
    type: 'line',
    source: 'ivory',
    'source-layer': 'ivory.road_line',
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

  const roadTrunk: any = {
    id: 'road-ctm-trunk',
    type: 'line',
    source: 'ivory',
    'source-layer': 'ivory.road_line',
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

  const highwayName: any = {
    id: 'highway-name-major-copy',
    type: 'symbol',
    source: 'ivory',
    'source-layer': 'ivory.road_line',
    minzoom: 12,
    filter: ['in', 'class', 'primary', 'secondary', 'tertiary'],
    layout: {
      'symbol-placement': 'line',
      'symbol-avoid-edges': true,
      'text-field': '{name}',
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
      visibility: visibility2D,
    },
    paint: {
      'text-color': 'rgb(0, 0, 0)',
      'text-halo-color': 'rgb(255, 255, 255)',
      'text-halo-width': {
        stops: [
          [0, 1],
          [16, 1.5],
          [17, 2],
        ],
      },
    },
  };

  const waterName: any = {
    id: 'water-name-ctm',
    type: 'symbol',
    source: 'ivory',
    'source-layer': 'ivory.watername',
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

  const ranhGioiLine: LineLayerSpecification = {
    id: 'ranhgioi-line',
    type: 'line',
    source: 'ivory',
    'source-layer': 'ivory.ranhgioi',
    paint: {
      'line-color': '#666',
      'line-width': 2,
      'line-dasharray': [2, 2],
    },
  };

  const matNuocFill: FillLayerSpecification = {
    id: 'matnuoc-fill',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.matnuoc',
    layout: { visibility: 'visible' },
    paint: {
      'fill-color': 'rgb(146,199,230)',
      'fill-opacity': 1,
    },
  };

  const viaHe: FillLayerSpecification = {
    id: 'viahe',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.matduong',
    filter: ['==', 'class', 'Vỉa hè'],
    paint: { 'fill-color': '#fcfdf5' },
    layout: { visibility: 'visible' },
  };

  const daiPhanCach: FillLayerSpecification = {
    id: 'daiphancach',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.matduong',
    filter: ['==', 'class', 'Giải phân cách'],
    paint: {
      'fill-color': 'rgba(102, 150, 100, 1)',
      'fill-opacity': 1,
    },
    layout: { visibility: 'visible' },
  };

  const thamCo: FillLayerSpecification = {
    id: 'thamco',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.ranhgioi',
    paint: { 'fill-color': '#7DBF52' },
    layout: { visibility: 'visible' },
  };

  const beMatNhanTao: FillLayerSpecification = {
    id: 'Bematnhantao_layer',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.bematnhantao',
    paint: {
      'fill-color': [
        'match',
        ['get', 'name'],
        'Sân cầu lông',
        '#3b5998',
        'Sân Tennis',
        '#3b5998',
        'Sân bóng rổ',
        '#3b5998',
        'Sân bóng bàn',
        '#3b5998',
        'khu vui chơi trẻ em',
        'rgb(0, 255, 0)',
        'Sân bóng đá',
        '#3b5998',
        '#7DBF52',
      ],
    },
    layout: { visibility: 'visible' },
  };

  const longDuong: FillLayerSpecification = {
    id: 'longduong',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.matduong',
    filter: ['==', 'class', 'Lòng đường'],
    paint: {
      'fill-color': 'rgba(192, 182, 194, 1)',
      'fill-outline-color': 'rgba(144, 128, 147, 1)',
      'fill-opacity': 1,
    },
    layout: { visibility: 'visible' },
  };

  const longDuongDat: FillLayerSpecification = {
    id: 'longduong_duongDat',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.matduong',
    filter: ['in', 'class', 'Đường đất', 'Cầu đi bộ', 'Cầu'],
    paint: {
      'fill-color': '#908093',
      'fill-outline-color': '#908093',
      'fill-opacity': 1,
    },
    layout: { visibility: 'visible' },
  };

  const baiDoXe: FillLayerSpecification = {
    id: 'baidoxe',
    type: 'fill',
    source: 'ivory',
    'source-layer': 'ivory.baidoxe',
    paint: {
      'fill-color': '#908093',
      'fill-opacity': 1,
    },
    layout: { visibility: 'visible' },
  };

  const congTrinh: FillExtrusionLayerSpecification = {
    id: 'congtrinh',
    type: 'fill-extrusion',
    source: 'ivory',
    'source-layer': 'ivory.congtrinh',
    paint: {
      'fill-extrusion-color': '#e0dad2',
      'fill-extrusion-height': 6,
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 1,
    },
    layout: { visibility: visibility2D },
  };

  const vachSonMatDat: LineLayerSpecification = {
    id: 'vachson-matdat',
    type: 'line',
    source: 'ivory',
    'source-layer': 'ivory.line',
    filter: ['==', 'type', 'Gờ phân làn giao thông'],
    paint: { 'line-color': 'rgb(236, 22, 22)' },
    layout: { visibility: 'visible' },
  };

  const vachKeDuong: LineLayerSpecification = {
    id: 'vachkeduong',
    type: 'line',
    source: 'ivory',
    'source-layer': 'ivory.line',
    paint: {
      'line-color': '#fff',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        0.4,
        17,
        1,
        18,
        1.5,
        19,
        2.5,
        20,
        3,
      ],
    },
    layout: { visibility: 'visible' },
  };

  const cayXanh: SymbolLayerSpecification = {
    id: 'cayxanh-symbol',
    type: 'symbol',
    source: 'ivory',
    'source-layer': 'ivory.cayxanh',
    layout: {
      'icon-image': 'ivory-sprite:0_Tree_4',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        0.1,
        17,
        0.1,
        18,
        0.12,
        19,
        0.15,
        20,
        0.2,
        21,
        0.3,
        22,
        0.4,
      ],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      visibility: 'visible',
    },
    paint: {
      'icon-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        16,
        0.5,
        17,
        1,
      ],
    },
  };

  const poiOutdoor: SymbolLayerSpecification = {
    id: 'poi_outdoor',
    type: 'symbol',
    source: 'ivory',
    'source-layer': 'ivory.routing_junctions',
    filter: [
      'any',
      ['==', ['get', 'type'], 'Poi'],
      ['==', ['get', 'type'], 'poi'],
      ['==', ['get', 'type'], 'POI'],
      ['==', ['get', 'type'], 'Landmark'],
    ],
    layout: {
      'icon-image': [
        'step',
        ['zoom'],
        [
          'match',
          ['get', 'category'],
          'Cổng ra vào',
          'ivory-sprite:a_Cong1_5',
          '',
        ],
        16,
        [
          'match',
          ['get', 'category'],
          'Nhà tiếp đón',
          'ivory-sprite:KDL_LeTan_1',
          'Bể bơi',
          'ivory-sprite:KDL_BeBoi',
          'Spa, Yoga, Gim',
          'ivory-sprite:KDL_Gym',
          'Cổng ra vào',
          'ivory-sprite:a_Cong1_3',
          'Công viên',
          'ivory-sprite:KDL_KhuTroChoi',
          'Ăn uống',
          'ivory-sprite:KDL_NhaHang',
          'Hồ',
          'ivory-sprite:KDL_Cau',
          'Nhà kỹ thuật',
          'ivory-sprite:KDL_PhongKyThuat_1',
          'Bãi đỗ xe ô tô',
          'ivory-sprite:a_Parking_Car',
          'Sân bóng rổ',
          'ivory-sprite:KDL_BongRo',
          'Sân tennis',
          'ivory-sprite:KDL_Tennis',
          'Sân cầu lông',
          'ivory-sprite:KDL_Tennis',
          'ivory-sprite:KDL_Check_in',
        ],
      ],
      'icon-size': ['match', ['get', 'category'], 'Nhà kỹ thuật', 0.3, 0.75],
      'text-field': [
        'step',
        ['zoom'],
        [
          'match',
          ['get', 'name'],
          ['Hồ Sen Đỏ', 'Hồ Sen Trắng (Vườn thiền)', 'Đồi Vọng Cảnh'],
          [
            'case',
            ['==', ['get', 'name'], 'Hồ Sen Trắng (Vườn thiền)'],
            'Hồ Sen Trắng',
            ['get', 'name'],
          ],
          '',
        ],
        18,
        [
          'match',
          ['get', 'name'],
          [
            'Lối đi qua hành lang',
            'Cửa ra vào',
            'Bậc thang',
            'Cầu',
            'Bàn Bida',
          ],
          '',
          ['get', 'name'],
        ],
      ],
      'text-font': ['Open Sans Bold'],
      'text-size': 14,

      'text-allow-overlap': false,

      'text-anchor': 'center',
      'text-justify': 'center',
      'symbol-placement': 'point',
      'text-offset': [0, 2],
      visibility: visibility2D,
    },
    paint: {
      'text-color': ' #232bc7',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
      'text-halo-blur': 2,
    },
  };

  return (
    <Source
      id='ivory'
      type='vector'
      tiles={['https://maps.vgm.ai/vts/ivory/{z}/{x}/{y}']}
      maxzoom={18}
    >
      <Layer {...waterWay} />
      <Layer {...waterPolygon} />
      <Layer {...waterWayName} />
      <Layer {...roadService} />
      <Layer {...roadTrunk} />
      <Layer {...highwayName} />
      <Layer {...waterName} />
      <Layer {...ranhGioiLine} />
      <Layer {...viaHe} />
      <Layer {...daiPhanCach} />
      <Layer {...thamCo} />
      <Layer {...beMatNhanTao} />
      <Layer {...matNuocFill} />

      <Layer {...longDuong} />
      <Layer {...longDuongDat} />
      <Layer {...baiDoXe} />
      <Layer {...congTrinh} />
      <Layer {...vachSonMatDat} />
      <Layer {...vachKeDuong} />
      <Layer {...cayXanh} />
      <Layer {...poiOutdoor} />
    </Source>
  );
};
