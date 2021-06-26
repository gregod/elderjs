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
      target: ${target}),
      props: ${component.prepared.requirePropDecompression ?  '$ejs' : ''}(${props}),
      hydrate: true
    });`
  }

  if (hydrateInstructions.loading === 'eager') {
    if (component.prepared.clientPropsUrl) {
      return `
      <script type="module">
        Promise.all([import("${component.client}"), import("${component.prepared.clientPropsUrl}")]).then(([component, props])=>{
          ${render_component(component,`document.getElementById('${component.name}')`, 'props.default')}
        });
      </script>
      `;
    } else {
      return `
      <script type="module">
        import("${component.client}").then((component)=>{
          ${render_component(component,`document.getElementById('${component.name}')`, component.prepared.clientPropsString || '{}')}
        });
      </script>
      `;
    }
  } else {
      return `
      <script type="module">
        ${
          hydrateInstructions.timeout > 0
            ? `requestIdleCallback(async function(){`
            : `window.addEventListener('load', async function (event) {`
          }
          const ${component.name}Props = ${
            component.prepared.clientPropsUrl ? `(await import('${component.prepared.clientPropsUrl}')).default` : component.prepared.clientPropsString
          }
          const init${component.name} = (props) => {
            import("${component.client}").then((component)=>{
              ${render_component(component,`document.getElementById('${component.name}')`,'props')}
            });
          };
          var observer${component.id} = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                observer.unobserve(document.getElementById('${component.name}'));
                if (document.eg_${component.name}) {
                  init${component.name}(${component.name}Props);
                } else {
                  document.eg_${component.name} = true;
                  init${component.name}(${component.name}Props);
                }
              }
            });
          }, {
            rootMargin: '${hydrateInstructions.rootMargin}',
            threshold: ${hydrateInstructions.threshold}
          });
          observer${component.id}.observe(document.getElementById('${component.name}'));
        ${hydrateInstructions.timeout > 0 ? `}, {timeout: ${hydrateInstructions.timeout}});` : '});'}
    
      </script>
        `;
  }
}
