import React from 'react';
import { Sidebar as FlowbiteSidebar } from 'flowbite-react';
import {
  ChartPieIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  QueueListIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/solid';

export function Sidebar() {
  return (
    <FlowbiteSidebar aria-label="Admin sidebar" className="fixed left-0 top-0 z-20 h-full pt-16 flex lg:flex flex-shrink-0 flex-col w-64 transition-width duration-75">
      <FlowbiteSidebar.Items>
        <FlowbiteSidebar.ItemGroup>
          <FlowbiteSidebar.Item href="/admin" icon={ChartPieIcon}>
            Dashboard
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item href="/admin/shows" icon={MicrophoneIcon}>
            Shows
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item href="/admin/songs" icon={MusicalNoteIcon}>
            Songs
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item href="/admin/playlists" icon={QueueListIcon}>
            Playlists
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item href="/admin/users" icon={UserGroupIcon}>
            Users
          </FlowbiteSidebar.Item>
          <FlowbiteSidebar.Item href="/admin/settings" icon={Cog6ToothIcon}>
            Settings
          </FlowbiteSidebar.Item>
        </FlowbiteSidebar.ItemGroup>
      </FlowbiteSidebar.Items>
    </FlowbiteSidebar>
  );
} 