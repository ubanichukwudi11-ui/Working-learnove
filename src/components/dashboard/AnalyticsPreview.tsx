import ProgressChart from "@/components/charts/ProgressChart";
import SubjectStrengthChart from "@/components/charts/SubjectStrengthChart";


export default function AnalyticsPreview(){

return (

<section className="mt-8">

<h2 className="text-2xl font-bold mb-5">
Analytics
</h2>


<div
className="
grid
lg:grid-cols-2
gap-6
"
>

<ProgressChart />

<SubjectStrengthChart />

</div>


</section>

)

}