import type { ISelectedElement } from '../../store';
import { getDisplayAttributes } from '../../utils';

type FlatPropertyItem =
  | { type: 'basic'; name: string; guid: string; localId: string | number }
  | { type: 'header'; label: string }
  | { type: 'property'; key: string; value: any };

export const flattenedProperties = (selectedElement: ISelectedElement) => {
  if (!selectedElement) return [];
  const items: FlatPropertyItem[] = [];

  // 1. Basic Info
  items.push({
    type: 'basic',
    name: selectedElement.Name || selectedElement.name || 'Unknown Element',
    guid: selectedElement._guid || 'N/A',
    localId: selectedElement._localId || 'N/A',
  });

  // 2. General Attributes
  const genAttrs = getDisplayAttributes(selectedElement);
  if (genAttrs.length > 0) {
    items.push({ type: 'header', label: 'General Attributes' });
    genAttrs.forEach(([key, val]) => {
      items.push({ type: 'property', key, value: val });
    });
  }

  // 3. Property Sets (psets)
  Object.entries(selectedElement.psets || {}).forEach(([psetName, props]) => {
    const validProps = Object.entries(props).filter(
      ([_, v]) => v !== null && v !== undefined && v !== ''
    );
    if (validProps.length > 0) {
      items.push({ type: 'header', label: psetName });
      validProps.forEach(([propName, val]) => {
        items.push({ type: 'property', key: propName, value: val });
      });
    }
  });

  return items;
};
