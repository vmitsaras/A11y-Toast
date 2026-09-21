import { C as ToastInstance } from "../types-CViYp0UD.js";

//#region src/adapters/menu-button-async-state.d.ts
interface MenuButtonAsyncStateToastAdapter {
  readonly instance: ToastInstance;
  readonly sourceRoot: HTMLElement;
  readonly announcementOwner: 'source';
  readonly isDestroyed: boolean;
  destroy(): void;
}
declare function createMenuButtonAsyncStateToastAdapter(instance: ToastInstance, sourceRoot: HTMLElement): MenuButtonAsyncStateToastAdapter;
//#endregion
export { MenuButtonAsyncStateToastAdapter, createMenuButtonAsyncStateToastAdapter };
//# sourceMappingURL=menu-button-async-state.d.ts.map