"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
    Bold, Italic, List, ListOrdered, Quote,
    Undo, Redo, Heading1, Heading2, Link as LinkIcon,
    Image as ImageIcon, Type, Strikethrough, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TipTapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const Toolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt("URL giriniz:");
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt("Resim URL'si giriniz:");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="border border-b-0 border-gray-200 rounded-t-md p-2 flex flex-wrap gap-1 bg-gray-50">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "bg-gray-200" : ""}
                type="button"
            >
                <Bold className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "bg-gray-200" : ""}
                type="button"
            >
                <Italic className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "bg-gray-200" : ""}
                type="button"
            >
                <Strikethrough className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive("code") ? "bg-gray-200" : ""}
                type="button"
            >
                <Code className="w-4 h-4" />
            </Button>

            <div className="w-[1px] h-6 bg-gray-300 mx-1 self-center" />

            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""}
                type="button"
            >
                <Heading1 className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""}
                type="button"
            >
                <Heading2 className="w-4 h-4" />
            </Button>

            <div className="w-[1px] h-6 bg-gray-300 mx-1 self-center" />

            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
                type="button"
            >
                <List className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
                type="button"
            >
                <ListOrdered className="w-4 h-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive("blockquote") ? "bg-gray-200" : ""}
                type="button"
            >
                <Quote className="w-4 h-4" />
            </Button>

            <div className="w-[1px] h-6 bg-gray-300 mx-1 self-center" />

            <Button variant="ghost" size="sm" onClick={addLink} type="button">
                <LinkIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={addImage} type="button">
                <ImageIcon className="w-4 h-4" />
            </Button>

            <div className="w-[1px] h-6 bg-gray-300 mx-1 self-center" />

            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} type="button">
                <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} type="button">
                <Redo className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg shadow-sm my-4',
                },
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[400px] max-w-none border border-gray-200 rounded-b-md p-4 bg-white',
            },
        },
    });

    return (
        <div className="w-full">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
