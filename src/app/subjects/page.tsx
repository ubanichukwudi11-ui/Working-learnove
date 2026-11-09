import AppLayout from "@/components/layout/AppLayout";

import SubjectsHeader from "@/components/subjects/SubjectsHeader";
import LearningSummaryCard from "@/components/subjects/LearningSummaryCard";
import SubjectGrid from "@/components/subjects/SubjectGrid";
import NovaSubjectAssistant from "@/components/subjects/NovaSubjectAssistant";

import FadeIn from "@/components/ui/FadeIn";


export default function SubjectsPage(){


return (

<AppLayout>


<FadeIn delay={0.1}>
<SubjectsHeader/>
</FadeIn>



<FadeIn delay={0.2}>
<LearningSummaryCard/>
</FadeIn>



<FadeIn delay={0.3}>
<SubjectGrid/>
</FadeIn>



<FadeIn delay={0.4}>
<NovaSubjectAssistant/>
</FadeIn>



</AppLayout>

)

}