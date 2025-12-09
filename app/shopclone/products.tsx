import { useEffect, useState } from "react";
import axios from "axios";
import { SHOP_CLONE_URL } from "../utils/cnstants";
export const useFetchProductsAndCategories = () => {
  const [products, setProducts] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      // console.log("THIS PRODUCTS P RAN");
      const link = `${SHOP_CLONE_URL}products.php?api_key=31035bb59dbb2863d68236c218dc9fdemn36NpfF2kh7xK4ocXa5jIvUq8TlCHY9`;
      // console.log("link", link);
      setIsLoading(true);
      try {
        const response = await axios.get(link).then((res) => res.data);
        // console.log("response", response);
        setProducts(response.data);
      } catch (err) {
        setError("Failed to fetch products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, isLoading, error };
};
