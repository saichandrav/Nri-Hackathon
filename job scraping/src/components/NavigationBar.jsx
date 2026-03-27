import { useState } from "react";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/1.png";
import { navItems } from "../constants";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto h-15 w-full max-w-475 px-5 sm:px-8">
        <div className="relative flex h-full items-center justify-between">
          
          {/* LOGO */}
          <div className="flex items-center shrink-0">
            <Link to="/">
              <img
                className="w-24 hover:opacity-80 transition"
                src={logo}
                alt="Logo"
              />
            </Link>
          </div>

          {/* DESKTOP NAV */}
          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-14 text-[16px] font-medium tracking-wide text-white/90 xl:flex">
            {navItems.map((item, index) => (
              <li key={index} className="py-3">
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    isActive
                      ? "text-white no-underline"
                      : "text-white/90 no-underline hover:text-white transition"
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* RIGHT SECTION */}
          <div className="hidden items-center gap-5 xl:flex">
            
            {!isLoggedIn && (
              <Link
                to="/login"
                className="rounded-xl border btn-primary border-white/55 px-4 py-1.5 text-[15px] font-medium text-white hover:border-white hover:bg-white/10 transition"
              >
                Get Started
              </Link>
            )}

            {isLoggedIn && (
              <Link
                to="/profile"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-r from-blue-400 to-orange-700 hover:opacity-85 transition"
                title="Profile"
              >
                <User className="text-white" />
              </Link>
            )}

          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="flex xl:hidden">
            <button
              onClick={toggleNavbar}
              className="rounded-md p-2 text-white/90 hover:bg-white/10 hover:text-white transition"
            >
              {mobileDrawerOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileDrawerOpen && (
          <>
            {/* OVERLAY */}
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* DRAWER */}
            <div className="fixed left-0 top-20 z-40 w-full border-t border-white/10 bg-black/95 p-8 xl:hidden">
              <ul className="space-y-2 text-center text-lg text-white/90">
                {navItems.map((item, index) => (
                  <li key={index} className="py-4">
                    <NavLink
                      to={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        isActive
                          ? "text-white font-semibold no-underline"
                          : "text-white/90 no-underline hover:text-white"
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* MOBILE ACTIONS */}
              <div className="mt-6 flex items-center justify-center gap-4">
                
                {!isLoggedIn && (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="rounded-xl border border-white/55 px-5 py-2 text-base font-medium text-white"
                    >
                      Sign In
                    </Link>

                    <Link
                      to="/signup"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="rounded-xl bg-linear-to-r from-orange-500 to-orange-800 px-5 py-2.5 text-base font-medium text-white"
                    >
                      Create Account
                    </Link>
                  </>
                )}

                {isLoggedIn && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-r from-blue-400 to-orange-700"
                  >
                    <User className="text-white" />
                  </Link>
                )}

                <Link to="/cart">
                  <ShoppingCart className="h-7 w-7 text-white/90" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;