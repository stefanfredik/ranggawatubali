import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect } from 'react'
import { Button } from './button'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Code, Quote, Undo, Redo } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!isMounted) {
    return null
  }

  return (
    <div className={cn('border rounded-md border-input', className)}>
      <div className="flex flex-wrap gap-1 p-1 border-b border-input bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('bold') })}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('italic') })}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('heading', { level: 1 }) })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('heading', { level: 2 }) })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('bulletList') })}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('orderedList') })}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('codeBlock') })}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 px-2', { 'bg-muted': editor?.isActive('blockquote') })}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none p-4" />
    </div>
  )
}