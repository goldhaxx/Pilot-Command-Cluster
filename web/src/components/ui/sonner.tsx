import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "group bg-[rgba(0,0,0,0.8)] border border-[rgba(255,255,255,0.1)] text-white",
          title: "text-eve.blue font-medium",
          description: "text-eve.gray text-sm",
          actionButton: "bg-eve.blue text-white",
          cancelButton: "bg-eve.red text-white",
          success: "!bg-[rgba(0,0,0,0.8)] border-eve.blue/30",
          error: "!bg-[rgba(0,0,0,0.8)] border-eve.red/30",
          info: "!bg-[rgba(0,0,0,0.8)] border-eve.blue/30",
          warning: "!bg-[rgba(0,0,0,0.8)] border-eve.yellow/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster } 