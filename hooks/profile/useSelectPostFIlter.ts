import { useRouter } from "expo-router";

const useSelectPostFilter = (filter: any, setFilter: any) => {
  // console.log("filter hook", filter);

  const router = useRouter();

  switch (filter) {
    case "Latest":
      // console.log("Latest");
      break;

    case "Oldest":
      // console.log("Oldest");
      break;

    case "Edit Post":
      router.push("/(posts)/editPost");
      setFilter("latest");
      return;

    default:
      break;
  }
};

export default useSelectPostFilter;
