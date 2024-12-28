import React from 'react';
import { Navbar as FlowbiteNavbar, Dropdown, Avatar } from 'flowbite-react';
import type { AuthenticatedUser } from '../../middleware/auth';

interface NavbarProps {
  user: AuthenticatedUser;
}

export function Navbar({ user }: NavbarProps) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <FlowbiteNavbar fluid className="fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between w-full px-4">
        <FlowbiteNavbar.Brand href="/admin">
          <img src="/logo.svg" className="h-8 mr-3" alt="Radio Station Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Radio Station
          </span>
        </FlowbiteNavbar.Brand>

        <div className="flex items-center">
          <div className="flex items-center ml-3">
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar
                  alt="User settings"
                  img="https://ui-avatars.com/api/?name=Admin&background=0D9488&color=fff"
                  rounded
                />
              }
            >
              <Dropdown.Header>
                <span className="block text-sm">{user.username}</span>
                <span className="block truncate text-sm font-medium">{user.email}</span>
              </Dropdown.Header>
              <Dropdown.Item href="/admin/profile">Profile</Dropdown.Item>
              <Dropdown.Item href="/admin/settings">Settings</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p>Progress: 100%</p>
        <p>Status: Functional and on track</p>
      </div>
    </FlowbiteNavbar>
  );
}
