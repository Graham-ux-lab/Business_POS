import React, { createContext, useContext, useReducer, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PosContext = createContext(null);

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
};

const TAX_RATE = 0.16;

const initialState = {
  cart: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
};

function calculateTotals(state) {
  const subtotal = state.cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const discountAmount = (subtotal * state.discount) / 100;
  const tax = (subtotal - discountAmount) * TAX_RATE;
  const total = subtotal - discountAmount + tax;
  return { ...state, subtotal, tax, total };
}

function posReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingIndex = state.cart.findIndex(item => item.id === action.payload.id);
      let newCart;
      if (existingIndex >= 0) {
        newCart = state.cart.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [...state.cart, { ...action.payload, quantity: 1 }];
      }
      return calculateTotals({ ...state, cart: newCart });
    }
    case 'REMOVE_FROM_CART': {
      const newCart = state.cart.filter((_, index) => index !== action.payload);
      return calculateTotals({ ...state, cart: newCart });
    }
    case 'UPDATE_QUANTITY': {
      const { index, quantity } = action.payload;
      if (quantity <= 0) {
        const newCart = state.cart.filter((_, i) => i !== index);
        return calculateTotals({ ...state, cart: newCart });
      }
      const newCart = state.cart.map((item, i) =>
        i === index ? { ...item, quantity } : item
      );
      return calculateTotals({ ...state, cart: newCart });
    }
    case 'SET_DISCOUNT':
      return calculateTotals({ ...state, discount: action.payload });
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
}

export const PosProvider = ({ children }) => {
  const [state, dispatch] = useReducer(posReducer, initialState);

  const addToCart = useCallback((product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  }, []);

  const removeFromCart = useCallback((index) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: index });
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity } });
  }, []);

  const setDiscount = useCallback((discount) => {
    dispatch({ type: 'SET_DISCOUNT', payload: discount });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const processPayment = async (paymentData) => {
    try {
      const response = await api.post('/sales', paymentData);
      if (response.data.success) {
        clearCart();
        toast.success('Sale completed!');
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
      throw error;
    }
  };

  return (
    <PosContext.Provider value={{
      ...state,
      addToCart, removeFromCart, updateQuantity,
      setDiscount, clearCart, processPayment,
      cartCount: state.cart.reduce((sum, item) => sum + item.quantity, 0),
    }}>
      {children}
    </PosContext.Provider>
  );
};
