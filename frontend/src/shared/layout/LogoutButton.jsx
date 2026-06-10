import LogoutIcon from "@mui/icons-material/Logout";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { setStoredToken, signOutRemote } from "../api/client.js";

export function LogoutButton() {
  const navigate = useNavigate();

  async function handleClick() {
    await signOutRemote();
    setStoredToken(null);
    navigate("/login", { replace: true });
  }

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<LogoutIcon />}
      onClick={handleClick}
      sx={{
        color: "text.primary",
        borderColor: "divider",
        "&:hover": {
          borderColor: "text.secondary",
          bgcolor: "action.hover",
        },
      }}
    >
      Log out
    </Button>
  );
}
