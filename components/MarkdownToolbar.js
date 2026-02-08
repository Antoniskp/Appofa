import React, { useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';

const MarkdownToolbar = ({ onInsert, textareaRef }) => {
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);
  const [isVideoDialogOpen, setVideoDialogOpen] = useState(false);
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [video, setVideo] = useState('');

  const insertLink = () => {
    onInsert(`\[${link}](${link})`);
    setLink('');
    setLinkDialogOpen(false);
  };

  const insertImage = () => {
    onInsert(`![Image](${image})`);
    setImage('');
    setImageDialogOpen(false);
  };

  const insertVideo = () => {
    onInsert(`![Video](${video})`);
    setVideo('');
    setVideoDialogOpen(false);
  };

  const openLinkDialog = () => setLinkDialogOpen(true);
  const openImageDialog = () => setImageDialogOpen(true);
  const openVideoDialog = () => setVideoDialogOpen(true);

  return (
    <div className="flex flex-col">
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex space-x-2">
        <button onClick={() => onInsert('# ')}>H1</button>
        <button onClick={() => onInsert('## ')}>H2</button>
        <button onClick={() => onInsert('### ')}>H3</button>
        <button onClick={() => onInsert('**Bold**')}>Bold</button>
        <button onClick={() => onInsert('*Italic*')}>Italic</button>
        <button onClick={() => onInsert('- List Item')}>Lists</button>
        <button onClick={openLinkDialog}>Link</button>
        <button onClick={openImageDialog}>Image</button>
        <button onClick={openVideoDialog}>Video</button>
      </div>

      {/* Mobile Toolbar */}
      <div className="sm:hidden">
        <button onClick={() => onInsert('# ')}>H1</button>
        <button onClick={() => onInsert('## ')}>H2</button>
        <button onClick={() => onInsert('### ')}>H3</button>
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <Dialog.Overlay />
        <div>
          <label>
            Link:
            <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />
          </label>
          <button onClick={insertLink}>Insert Link</button>
        </div>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onClose={() => setImageDialogOpen(false)}>
        <Dialog.Overlay />
        <div>
          <label>
            Image URL:
            <input type="text" value={image} onChange={(e) => setImage(e.target.value)} />
          </label>
          <button onClick={insertImage}>Insert Image</button>
        </div>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={isVideoDialogOpen} onClose={() => setVideoDialogOpen(false)}>
        <Dialog.Overlay />
        <div>
          <label>
            Video URL:
            <input type="text" value={video} onChange={(e) => setVideo(e.target.value)} />
          </label>
          <button onClick={insertVideo}>Insert Video</button>
        </div>
      </Dialog>
    </div>
  );
};

export default MarkdownToolbar;