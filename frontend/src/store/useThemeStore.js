import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("streamLoop-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("streamLoop-theme", theme);
    set({ theme });
  },
}));
