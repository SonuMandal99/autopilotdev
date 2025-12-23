import React from 'react';
import { 
  FiHome, 
  FiGitBranch, 
  FiCode, 
  FiPackage, 
  FiCloud, 
  FiSettings,
  FiFileText,
  FiActivity,
  FiDatabase,
  FiServer
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <FiHome />,
    },
    {
      title: 'Repository',
      icon: <FiGitBranch />,
      subItems: [
        { title: 'Analyze Repo', path: '/analyze', icon: <FiCode /> },
        { title: 'Clone Repo', path: '/clone', icon: <FiGitBranch /> },
      ],
    },
    {
      title: 'Code Generation',
      icon: <FiCode />,
      subItems: [
        { title: 'Generate Code', path: '/generate', icon: <FiCode /> },
        { title: 'Code Review', path: '/review', icon: <FiFileText /> },
      ],
    },
    {
      title: 'DevOps',
      icon: <FiServer />,
      subItems: [
        { title: 'Docker Config', path: '/docker', icon: <FiPackage /> },
        { title: 'Kubernetes', path: '/kubernetes', icon: <FiCloud /> },
        { title: 'CI/CD Pipeline', path: '/cicd', icon: <FiActivity /> },
      ],
    },
    {
      title: 'Deployment',
      path: '/deploy',
      icon: <FiCloud />,
    },
    {
      title: 'Database',
      path: '/database',
      icon: <FiDatabase />,
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <FiSettings />,
    },
  ];

  return (
    <aside className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 text-white 
      transition-all duration-300 ease-in-out z-40 overflow-y-auto
      ${isOpen ? 'w-64' : 'w-0 md:w-16'}
    `}>
      {/* Sidebar content */}
      <div className={`${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'} transition-opacity duration-300`}>
        <nav className="py-4">
          {menuItems.map((item, index) => (
            <div key={index} className="mb-2">
              {/* Main menu item */}
              {item.path ? (
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-4 py-3 mx-2 rounded-lg transition-colors
                    ${location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                    }
                  `}
                >
                  <span className={`${isOpen ? 'mr-3' : 'mx-auto'}`}>
                    {item.icon}
                  </span>
                  {isOpen && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </Link>
              ) : (
                <div className="px-4 py-2">
                  {isOpen ? (
                    <>
                      <div className="flex items-center text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                      </div>
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`
                            flex items-center py-2 px-6 rounded-lg mb-1 transition-colors
                            ${location.pathname === subItem.path
                              ? 'bg-blue-900 text-blue-200'
                              : 'hover:bg-gray-800 text-gray-400'
                            }
                          `}
                        >
                          <span className="mr-3">{subItem.icon}</span>
                          <span className="text-sm">{subItem.title}</span>
                        </Link>
                      ))}
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">{item.icon}</div>
                      <div className="space-y-1">
                        {item.subItems.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="block p-2 hover:bg-gray-800 rounded-lg"
                            title={subItem.title}
                          >
                            {subItem.icon}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Quick Stats (visible only when sidebar is open) */}
        {isOpen && (
          <div className="mt-8 mx-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Projects</span>
                <span className="text-blue-400 font-bold">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Deployments</span>
                <span className="text-green-400 font-bold">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">AI Calls</span>
                <span className="text-purple-400 font-bold">156</span>
              </div>
            </div>
          </div>
        )}

        {/* Version info */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="text-center">
            {isOpen ? (
              <div className="text-xs text-gray-500">
                <p>AutoPilotDev v1.0</p>
                <p className="mt-1">Computer Dept Project</p>
              </div>
            ) : (
              <div className="text-xs text-gray-500">v1.0</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;