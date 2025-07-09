

export default function Export() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl poppins-bold text-center w-full ">Export</h1>
      <p className="text-2xs w-full text-center mt-[-6px] text-neutral-100">recuperer sous fichier excel tout vos donner</p>
      <div className="flex w-[95%] h-[400px] py-2">
        <table className="w-full flex border-collapse">
          <thead className="w-full h-8 border border-blue-500">
            <tr className="w-full flex justify-between *:text-center h-full *:text-md *:text-whit *:bg-blue-500 uppercase *:border *:w-full *:h-full *:border-black">
              <th>lieux</th>
              <th>date</th>
              <th>heure</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  )
}
