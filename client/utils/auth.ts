export const auth = {
  login(user: string) {
    localStorage.setItem("user", user);
  },

  logout() {
    localStorage.removeItem("user");
  },

  isLoggedIn() {
    return !!localStorage.getItem("user");
  },
};
