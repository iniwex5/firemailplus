'use client'

import { useMemo } from 'react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useUIStore } from '@/lib/store'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const current = theme || 'system'

  const Icon = useMemo(() => {
    if ((resolvedTheme || current) === 'dark') return Moon
    if ((resolvedTheme || current) === 'light') return Sun
    return Laptop
  }, [resolvedTheme, current])

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t)
    useUIStore.getState().setTheme(t)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2 h-auto" title="主题">
          <Icon className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => applyTheme('light')} className={current === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''}>
          <Sun className="w-4 h-4 mr-2" />
          亮色
          {current === 'light' && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme('dark')} className={current === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''}>
          <Moon className="w-4 h-4 mr-2" />
          暗色
          {current === 'dark' && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme('system')} className={current === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''}>
          <Laptop className="w-4 h-4 mr-2" />
          跟随系统
          {current === 'system' && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

