import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const alreadyExists = cart.find(product => product.id === productId);
      const stockAmount = await api.get(`/stock/${productId}`).then(stockResponse => stockResponse.data.amount);

      if (!alreadyExists) {
        await api.get(`/products/${productId}`).then(productResponse => productResponse.data).then(product => {
          product.amount = 1;
          newCart.push(product);
        });
      }
      else {
        if ((alreadyExists.amount + 1) > stockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        };
        newCart.map(product => {
          if (product.id === productId) {
            product.amount += 1;
            return product;
          } else {
            return product;
          };
        });
      };

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => {
        if (product.id !== productId) {
          return product;
        };
      });
      if(cart.length !== newCart.length){
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else{
        throw new Error;
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const stockAmount = await api.get(`/stock/${productId}`).then(stockResponse => stockResponse.data.amount);
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if(amount <= 0){
        return;
      }
      newCart.map(product => {
        if(product.id === productId){
          product.amount = amount;
          return product;
        };
      });
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
