import { IComponentToHydrate } from '../utils/Page';

export default function hydrateComponent(component: IComponentToHydrate) {
  const hydrateInstructions = {
    rootMargin: '200px',
    threshold: 0,
    timeout: 1000,
    ...component.hydrateOptions,
  };


  let render_component = function(component : IComponentToHydrate,target : string, props : string) : string{
    return `
    new component.default({ 
      target: ${target},
      props: ${component.prepared.requirePropDecompression ?  `$ejs(${props})` : props},
      hydrate: true
    });`
  }

  if (hydrateInstructions.loading === 'eager') {
    if (component.prepared.clientPropsUrl) {
      return `
      <script>
        Promise.all([import("${component.client}"), import("${component.prepared.clientPropsUrl}")]).then(([component, props])=>{
          ${render_component(component,`document.getElementById('${component.name}')`, 'props.default')}
        });
      </script>
      `;
    } else {
      return `
      <script>
        import("${component.client}").then((component)=>{
          ${render_component(component,`document.getElementById('${component.name}')`, component.prepared.clientPropsString || '{}')}
        });
      </script>
      `;
    }
  } else {
      return `
      <script>
        ${
          hydrateInstructions.timeout > 0
            ? `requestIdleCallback(async function(){`
            : `window.addEventListener('load', async function (event) {`
          }
          (new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                observer.unobserve(entry.target);
                ${ component.prepared.clientPropsUrl ? `Promise.all([import("${component.client}"),import("${component.prepared.clientPropsUrl}")]).then(async ([component,props])=>{` : `import("${component.client}").then(async (component)=>{` }
                  ${render_component(component,`entry.target`,
                    component.prepared.clientPropsUrl ? `props.default` : component.prepared.clientPropsString
                  )}
                });
              }
            });
          }, {
            rootMargin: '${hydrateInstructions.rootMargin}',
            threshold: ${hydrateInstructions.threshold}
          })).observe(document.getElementById('${component.name}'));
        ${hydrateInstructions.timeout > 0 ? `}, {timeout: ${hydrateInstructions.timeout}});` : '});'}
    
      </script>
        `;
  }
}
