import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <Loader2 className="animate-spin" />
    </div>
  );
};

export default Loading;
