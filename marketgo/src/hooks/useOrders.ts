import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  advanceOrder,
  cancelOrder,
  createOrder,
  createOrderReview,
  getLastAddress,
  getOrder,
  getOrderReview,
  listOrders,
} from '@/services/orders';
import { isActive } from '@/utils/orders';

export const useOrders = () =>
  useQuery({ queryKey: ['orders', 'list'], queryFn: listOrders });

// Enquanto o pedido está em andamento, consulta de novo a cada 5 segundos.
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isActive(status) ? 5000 : false;
    },
  });
}

export const useLastAddress = () =>
  useQuery({
    queryKey: ['orders', 'last-address'],
    queryFn: getLastAddress,
    staleTime: Infinity,
  });

function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['orders'] });
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({ mutationFn: createOrder, onSuccess: invalidate });
}

export function useAdvanceOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => advanceOrder(id),
    onSuccess: invalidate,
  });
}

export function useCancelOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: invalidate,
  });
}

// Desafio Apêndice C: Hooks para avaliação do pedido
export function useOrderReview(orderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'review', orderId],
    queryFn: () => getOrderReview(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useCreateOrderReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      rating,
      comment,
    }: {
      orderId: string;
      rating: number;
      comment?: string;
    }) => createOrderReview(orderId, rating, comment),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['orders', 'review', variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
