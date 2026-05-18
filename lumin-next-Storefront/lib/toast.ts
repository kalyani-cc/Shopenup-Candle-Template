export type ToastType = "success" | "info" | "error";

export function luminToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("lumin_next:toast", { detail: { message, type } })
  );
}
