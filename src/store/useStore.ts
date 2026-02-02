import { create } from "zustand";

export type GestureType =
  | "IDLE"
  | "PINCH"
  | "GRAB"
  | "PALM_OPEN"
  | "POINT"
  | "VICTORY";

export interface Point {
  x: number;
  y: number;
  z: number;
}

export type HandLandmark = Point;

interface HandUI {
  visible: boolean;
  x: number;
  y: number;
  gesture: GestureType;
}

interface StoreState {

  leftHand: HandLandmark[] | null;
  rightHand: HandLandmark[] | null;


  leftGesture: GestureType;
  rightGesture: GestureType;


  handUiData: {
    left: HandUI;
    right: HandUI;
  };


  notifications: Array<{ id: string; message: string; type: "info" | "warning" | "success"; timestamp: number }>;
  addNotification: (message: string, type?: "info" | "warning" | "success") => void;
  removeNotification: (id: string) => void;


  setHands: (left: HandLandmark[] | null, right: HandLandmark[] | null) => void;
  setGestures: (left: GestureType, right: GestureType) => void;
  updateHandUI: (hand: "left" | "right", data: Partial<HandUI>) => void;
}

export const useStore = create<StoreState>((set) => ({
  leftHand: null,
  rightHand: null,

  leftGesture: "IDLE",
  rightGesture: "IDLE",

  handUiData: {
    left: { visible: false, x: 0, y: 0, gesture: "IDLE" },
    right: { visible: false, x: 0, y: 0, gesture: "IDLE" },
  },

  notifications: [],

  setHands: (left, right) => set({ leftHand: left, rightHand: right }),
  setGestures: (left, right) => set({ leftGesture: left, rightGesture: right }),
  updateHandUI: (hand, data) =>
    set((state) => ({
      handUiData: {
        ...state.handUiData,
        [hand]: { ...state.handUiData[hand], ...data },
      },
    })),

  addNotification: (message, type = "info") => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, timestamp: Date.now() }],
    }));
    setTimeout(() => {
      useStore.getState().removeNotification(id);
    }, 5000);
  },
  removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
