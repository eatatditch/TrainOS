interface StepBlockProps {
  steps: { title: string; description: string; details?: string[] }[];
}

export function StepBlock({ steps }: StepBlockProps) {
  return (
    <div className="my-5">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          {/* Left column: number circle + connecting line */}
          <div className="flex flex-col items-center">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ditch-orange text-sm font-black text-white shadow-sm">
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="w-0.5 grow bg-ditch-orange/20 my-1" />
            )}
          </div>

          {/* Right column: content */}
          <div className={`pb-6 ${index === steps.length - 1 ? "pb-0" : ""}`}>
            <p className="font-extrabold leading-8 text-ditch-ink">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-ditch-navy/70">{step.description}</p>
            {step.details && step.details.length > 0 && (
              <ul className="mt-2 space-y-1">
                {step.details.map((detail, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-500 flex items-start gap-2"
                  >
                    <span className="text-ditch-orange mt-1.5 shrink-0">
                      &bull;
                    </span>
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
