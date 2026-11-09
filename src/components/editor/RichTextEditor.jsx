import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { uploadBlogImage } from '../../services/storage';

export function RichTextEditor({ content, onChange, placeholder = 'Write your solar blog post here...' }) {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline font-medium hover:text-blue-800',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-4 shadow-sm',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          html: editor.getHTML(),
          json: editor.getJSON(),
          text: editor.getText(),
        });
      }
    },
  });

  const handleInsertImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInlineImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const { publicUrl } = await uploadBlogImage(file, 'inline');
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch (err) {
      alert(`Could not insert image: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="border border-slate-300 rounded-xl bg-white shadow-xs focus-within:ring-2 focus-within:ring-solar-500 focus-within:border-solar-500 transition-all">
      <EditorToolbar editor={editor} onInsertImage={handleInsertImageClick} />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInlineImageUpload}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div className="min-h-[350px]">
        <EditorContent editor={editor} />
      </div>

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-400">
        <span>Rich Text Editor (TipTap)</span>
        <span>
          {editor ? `${editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words` : ''}
        </span>
      </div>
    </div>
  );
}
