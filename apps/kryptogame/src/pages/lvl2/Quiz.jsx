import Quiz from "../../components/quiz/Quiz";
import AlphabetTable from "../../components/AlphabetTable";

export default function QuizLevel2(props) {
  return (
    <Quiz
      {...props}
      intro={
        <div className="mb-8 text-style">
          <p className="font-semibold mb-2">Schlüsselalphabet:</p>
          <AlphabetTable cipher="MNBVCXZLKJHGFDSAPOIUYTREWQ" />
        </div>
      }
    />
  );
}
