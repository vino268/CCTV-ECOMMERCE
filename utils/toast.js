export const showToast = (message, type = "success") => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("show-toast", {
      detail: { message, type },
    });
    window.dispatchEvent(event);
  }
};
