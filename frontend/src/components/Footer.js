import React from "react";
import { Box, Typography } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";

const activeLinkStyle = {
  borderBottom: "3px solid white",
  textDecoration: "none",
  color: "white",
  fontFamily: "Poppins, sans-serif",
  fontSize: "16px",
};

const defaultLinkStyle = {
  textDecoration: "none",
  color: "white",
  fontFamily: "Poppins, sans-serif",
  fontSize: "16px",
  transition: "all 0.3s ease", // Smooth transition effect
};

const Footer = () => {
  const location = useLocation();

  const isLandingActive =
    location.pathname === "/" || location.pathname === "/landing";

  return (
    <Box
      sx={{
        bgcolor: "black", // Changed background to black
        padding: 2,
        textAlign: "center",
        marginTop: "auto",
        font: "inherit",
      }}
    >
      {/* Navigation Links */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        {[{ to: "/home", label: "Home" }, { to: "/profile", label: "Profile" }, { to: "/login", label: "Login" }, { to: "/register", label: "Register" }, { to: "/", label: "Landing", isLanding: true }].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) =>
              (link.isLanding && isLandingActive) || isActive
                ? activeLinkStyle
                : defaultLinkStyle
            }
            className="nav-link"
          >
            <Typography
              sx={{
                "&:hover": {
                  transform: "scale(1.05)", // Increase size on hover
                },
                transition: "transform 0.2s ease",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {link.label}
            </Typography>
          </NavLink>
        ))}
      </Box>

      {/* Footer Text */}
      <Typography
        variant="body2"
        sx={{
          color: "white",
          fontFamily: "Poppins, sans-serif",
          font: "inherit",
        }}
      >
        © {new Date().getFullYear()} DocuThinker. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
