
type props = {
  image: string;
};
export default function CameraComponent({ image }: props) {
  return (
    <div className="w-[475px] h-[300px] bg-sky-200 p-0 rounded-md overflow-hidden shadow-lg border-[1px] border-gray-400">
      <div className=" h-full w-full bg-black">
        <img src={image} alt="alt" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
