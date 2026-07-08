import AppNavbar from "../components/AppNavbar";
import Card from "../components/Card";

export default function Home(params) {
    const people = [
        "Vishwas", "arjun", "Ryan"
    ]

    const listItems = people.map(p => <li>{p}</li>)
    return (
        <div>
            <AppNavbar />
            This is a Home page
            <ul>
                {listItems}
            </ul>
        </div>
    )
}