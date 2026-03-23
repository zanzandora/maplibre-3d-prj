import * as OBC from '@thatopen/components';

export const setupClipper = (
  clipper: OBC.Clipper,
  world: OBC.World,
  container: HTMLElement
) => {
  clipper.enabled = true;
  clipper.visible = true;

  const handleDblClick = () => {
    if (clipper.enabled) clipper.create(world);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      (event.code === 'Delete' || event.code === 'Backspace') &&
      clipper.enabled
    ) {
      clipper.delete(world);
    }
  };

  container.addEventListener('dblclick', handleDblClick);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    clipper.enabled = false;
    clipper.visible = false;
    container.removeEventListener('dblclick', handleDblClick);
    window.removeEventListener('keydown', handleKeyDown);
  };
};
