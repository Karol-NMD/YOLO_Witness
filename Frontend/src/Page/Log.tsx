import PasswordInput from "@/components/myne/Password";
import { Button } from "@/components/ui/button"
import { Eye, EyeClosed } from "lucide-react";
import { ChangeEvent, useState } from "react"

interface FormData {
  nom: string;
  surname: string;
  password: string;
}
export default function Log() {
    const [ isSignIn, setIsSignIn ] = useState<boolean>(false)
    const handleChange = () => {
        setIsSignIn(!isSignIn);
    }
    // const [formData, setFormData] = useState<FormData>({
    //     nom: '',
    //     surname: '',
    //     password: '',
    // });
//     const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
//     // La déstructuration des propriétés de event.target fonctionne de la même manière.
//     // TypeScript inférera correctement les types de `name`, `value`, `type` et `checked`.
//     const { name, value, type } = event.target;

//     // La logique pour déterminer la nouvelle valeur reste la même
//     const newValue =  value;

//     // Mettre à jour l'état de manière immuable.
//     // TypeScript vérifiera que `name` est une clé valide de `formData`
//     // et que `newValue` correspond au type attendu pour cette clé.
//     setFormData(prevFormData => ({
//       ...prevFormData,
//       [name]: newValue,
//     }));
//   };
    const  [ name, setName ] = useState<string>('');
    const  [ surName, setSurName ] = useState<string>('');
    const  [ password, setPassword ] = useState<string>('');
    const handleChangeName = (e:ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }
    const handleChangeSurName = (e:ChangeEvent<HTMLInputElement>) => {
        setSurName(e.target.value);
    }
    const handleChangePassword = (e:ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }
    const [ show, setShow ] = useState<boolean>(false)
    const showPassword = () => {
        setShow( prev => !show);
    }
  return (
    <div className="flex flex-col justify-center items-center w-full h-screen bg-sky-100 poppins">
        <div className="flex w-full h-20 justify-center">
            <img src="./LogoWitness.png" className="h-full object-cover scale-300" alt="" />
        </div>
        <form className="flex flex-col items-center w-200 h-100 py-4 bg-white shadow-lg border-2 text-black z-10">
            <div className="flex flex-col items-center">
                <h3 className="text-3xl poppins-bold uppercase">{isSignIn === false ? 'Sign Up':' Sign In'}</h3>
                <h3 className="text-xs mt-[-6px] text-neutral-100">{isSignIn === false ? 'entrer vos donnees afin que nous vous enregistrons':'entrer vos donnees afin que nous vous redirigons vers votre adshboard'}</h3>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 w-[90%] h-full my-2 px-4 py-2">
                <div className="flex flex-col w-[90%]">
                    <label htmlFor="Name">Name :</label>
                    <input 
                        type="text" 
                        id="Name"
                        value={name}
                        onChange={handleChangeName}
                        placeholder="entrer votre nom"
                        className="border h-10"
                    />
                </div>
                {isSignIn === false ? (
                    <>
                        <div className="flex flex-col w-[90%]">
                            <label htmlFor="Name">Name :</label>
                            <input 
                                type="text" 
                                id="Name"
                                value={surName}
                                onChange={handleChangeSurName}
                                placeholder="entrer votre prenom"
                                className="border h-10"
                            />
                        </div>
                    </>
                ):('')}
                <div className="flex flex-col w-[90%]">
                    <label htmlFor="password">Password :</label>
                    <PasswordInput id="password" name="password" value={password} onChange={handleChangePassword} className="pl-2 w-full" placeholder="entrez votre mots de passe" />
                    {/* </div> */}
                </div>
            </div>
            <div className="flex flex-col w-full items-center">
                <Button className="w-30 shadow-lg bg-blue-500 text-black hover:text-white hover:bg-black cursor-pointer duration-300 text-xl justify-center items-center flex pb-2">submit</Button>
                {isSignIn === false ? (<p className="text-md group text-sm">Souhaitez-vous vous connecter ?<span onClick={handleChange} className="poppins-bold hover:text-blue-600 duration-300 group-hover:underline cursor-pointer">cliquez ici</span> </p>):(<p className="text-md group text-sm">Souhaitez-vous vous enregistrer ?<span onClick={handleChange} className="poppins-bold hover:text-blue-600 duration-300 group-hover:underline cursor-pointer">cliquez ici</span> </p>)}
            </div>
        </form>
    </div>
  )
}
