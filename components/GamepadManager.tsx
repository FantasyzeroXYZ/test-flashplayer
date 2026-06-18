import React, { useEffect, useRef } from 'react';
import { KeyMap, GamepadMap, DEFAULT_GAMEPAD_MAP } from '../types';

interface GamepadManagerProps {
  keyMapP1: KeyMap;
  keyMapP2?: KeyMap;
  gamepadMapP1?: GamepadMap;
  gamepadMapP2?: GamepadMap;
  enableP2?: boolean;
  onInput?: (active: boolean) => void;
}

export const GamepadManager: React.FC<GamepadManagerProps> = ({ 
  keyMapP1, keyMapP2, 
  gamepadMapP1 = DEFAULT_GAMEPAD_MAP, 
  gamepadMapP2 = DEFAULT_GAMEPAD_MAP,
  enableP2, onInput 
}) => {
  const requestRef = useRef<number>(0);
  // Store button states for up to 4 gamepads (though we only use 2)
  const prevButtons = useRef<boolean[][]>([
      new Array(20).fill(false),
      new Array(20).fill(false)
  ]); 
  const prevAxes = useRef<number[][]>([
      [0, 0],
      [0, 0]
  ]);

  const simulateKey = (key: string, type: 'keydown' | 'keyup') => {
    // Dispatch standard keyboard event
    const event = new KeyboardEvent(type, {
      key: key,
      code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
      bubbles: true,
      cancelable: true,
      view: window
    });

    const k = key.toUpperCase();
    let code = 0;
    if (k === 'ARROWUP') code = 38;
    else if (k === 'ARROWDOWN') code = 40;
    else if (k === 'ARROWLEFT') code = 37;
    else if (k === 'ARROWRIGHT') code = 39;
    else if (k === 'ENTER') code = 13;
    else if (k === 'SPACE') code = 32;
    else if (k === 'SHIFT') code = 16;
    else if (k === 'CONTROL') code = 17;
    else if (k === 'ALT') code = 18;
    else if (k.length === 1) code = k.charCodeAt(0);

    Object.defineProperty(event, 'keyCode', { get: () => code });
    Object.defineProperty(event, 'which', { get: () => code });

    window.dispatchEvent(event);
    
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) rufflePlayer.dispatchEvent(event);
  };

  const update = () => {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Loop through gamepads. index 0 = P1, index 1 = P2.
    for (let gpIndex = 0; gpIndex < 2; gpIndex++) {
        if (gpIndex === 1 && !enableP2) continue; // Skip P2 if disabled

        const gp = gamepads[gpIndex];
        if (!gp) continue;
        
        // Select correct keymap and gamepad map
        const currentKeyMap = gpIndex === 0 ? keyMapP1 : keyMapP2;
        const currentGamepadMap = gpIndex === 0 ? gamepadMapP1 : gamepadMapP2;
        
        if (!currentKeyMap || !currentGamepadMap) continue;

        if (onInput) onInput(true);

        // Iterate through all logical actions defined in GamepadMap
        // and check if the corresponding button is pressed.
        for (const actionKey in currentGamepadMap) {
            const action = actionKey as keyof GamepadMap;
            const btnIndex = currentGamepadMap[action];
            const targetKey = currentKeyMap[action as keyof KeyMap];
            
            if (btnIndex !== undefined && targetKey) {
                // Check if button exists on gamepad
                if (gp.buttons[btnIndex]) {
                    const pressed = gp.buttons[btnIndex].pressed;
                    
                    // Simple debounce/edge detection
                    // Note: We are using a single large array for prevButtons across all potential indices.
                    // Assuming btnIndex < 20.
                    if (pressed !== prevButtons.current[gpIndex][btnIndex]) {
                        simulateKey(targetKey, pressed ? 'keydown' : 'keyup');
                        prevButtons.current[gpIndex][btnIndex] = pressed;
                    }
                }
            }
        }
        
        // Axes (Left Stick)
        // We could also map these to actions, but usually stick behavior is standard.
        // For full customization, we'd need 'axisMap'. For now, hardcode to logical Up/Down/Left/Right keys.
        const xAxis = gp.axes[0];
        const yAxis = gp.axes[1];
        const threshold = 0.5;

        // X Axis
        if (xAxis < -threshold && prevAxes.current[gpIndex][0] >= -threshold) simulateKey(currentKeyMap.left, 'keydown');
        else if (xAxis >= -threshold && prevAxes.current[gpIndex][0] < -threshold) simulateKey(currentKeyMap.left, 'keyup');
        
        if (xAxis > threshold && prevAxes.current[gpIndex][0] <= threshold) simulateKey(currentKeyMap.right, 'keydown');
        else if (xAxis <= threshold && prevAxes.current[gpIndex][0] > threshold) simulateKey(currentKeyMap.right, 'keyup');

        // Y Axis
        if (yAxis < -threshold && prevAxes.current[gpIndex][1] >= -threshold) simulateKey(currentKeyMap.up, 'keydown');
        else if (yAxis >= -threshold && prevAxes.current[gpIndex][1] < -threshold) simulateKey(currentKeyMap.up, 'keyup');

        if (yAxis > threshold && prevAxes.current[gpIndex][1] <= threshold) simulateKey(currentKeyMap.down, 'keydown');
        else if (yAxis <= threshold && prevAxes.current[gpIndex][1] > threshold) simulateKey(currentKeyMap.down, 'keyup');

        prevAxes.current[gpIndex] = [xAxis, yAxis];
    }
    
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [keyMapP1, keyMapP2, gamepadMapP1, gamepadMapP2, enableP2]);

  return null;
};