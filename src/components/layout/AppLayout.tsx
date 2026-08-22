import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-dark-900 flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <main className="flex-1 pb-20 lg:pb-0 lg:overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  )
}
