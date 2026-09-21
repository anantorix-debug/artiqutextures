export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-muted/40 to-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Artiqu Surface — where surfaces become art" className="mx-auto mb-3 h-44 w-auto rounded-2xl shadow-sm sm:h-52" />
          <h1 className="sr-only">Artiqu Surface CRM</h1>
          <p className="text-sm text-muted-foreground">CRM &amp; Quotation Management</p>
        </div>
        {children}
      </div>
    </div>
  );
}
